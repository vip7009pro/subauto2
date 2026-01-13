package com.autosubtitles.app.ui.viewmodel

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.autosubtitles.app.core.TranslationManager
import com.autosubtitles.app.core.VideoProcessor
import com.autosubtitles.app.core.WhisperEngine
import com.autosubtitles.app.data.ProjectRepository
import com.autosubtitles.app.model.Project
import com.autosubtitles.app.model.SubtitleItem
import kotlinx.coroutines.launch
import java.io.File

class ProjectViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = ProjectRepository(application)
    private val whisperEngine = WhisperEngine(application)
    private val translationManager = TranslationManager(application)
    private val downloader = com.autosubtitles.app.core.ModelDownloader(application)
    
    var projects by mutableStateOf<List<Project>>(emptyList())
        private set
    
    var currentProject by mutableStateOf<Project?>(null)
        private set

    var isProcessing by mutableStateOf(false)
        private set

    var lastRenderedPath by mutableStateOf<String?>(null)
        private set

    var selectedModel by mutableStateOf(repository.getSelectedModel())
        private set

    var modelDownloadProgress by mutableStateOf<Float?>(null)
        private set

    init {
        loadProjects()
    }

    fun isModelDownloaded(model: com.autosubtitles.app.model.AiModel): Boolean {
        return downloader.isDownloaded(model)
    }

    fun setModel(model: com.autosubtitles.app.model.AiModel) {
        selectedModel = model
        repository.setSelectedModel(model)
    }

    fun downloadModel(model: com.autosubtitles.app.model.AiModel) {
        viewModelScope.launch {
            modelDownloadProgress = 0f
            val success = downloader.download(model) { progress ->
                modelDownloadProgress = progress
            }
            modelDownloadProgress = null
        }
    }

    fun loadProjects() {
        projects = repository.getAllProjects()
    }

    fun selectProject(project: Project?) {
        currentProject = project
    }

    fun createProject(name: String, videoUri: String, duration: Long) {
        val newProject = Project(name = name, videoUri = videoUri, duration = duration)
        repository.saveProject(newProject)
        loadProjects()
        selectProject(newProject)
    }

    fun startTranscription() {
        val project = currentProject ?: return
        viewModelScope.launch {
            isProcessing = true
            try {
                val videoFile = getLocalPathFromUri(project.videoUri) ?: return@launch
                val cacheDir = getApplication<Application>().cacheDir
                val audioFile = File(cacheDir, "${project.id}.wav")
                
                if (VideoProcessor.extractAudio(videoFile, audioFile)) {
                    val modelPath = File(getApplication<Application>().filesDir, selectedModel.fileName).absolutePath
                    val subs = whisperEngine.transcribe(audioFile, modelPath)
                    updateSubtitles(subs)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                isProcessing = false
            }
        }
    }

    fun startRendering() {
        val project = currentProject ?: return
        viewModelScope.launch {
            isProcessing = true
            try {
                val cacheDir = getApplication<Application>().cacheDir
                val subFile = File(cacheDir, "${project.id}.srt")
                
                val srtContent = project.subtitles.mapIndexed { i, sub ->
                    "${i + 1}\n${formatSrtTime(sub.start)} --> ${formatSrtTime(sub.end)}\n${sub.text}\n"
                }.joinToString("\n")
                
                subFile.writeText(srtContent)
                
                val videoFile = getLocalPathFromUri(project.videoUri) ?: return@launch
                val outputFile = File(cacheDir, "rendered_${project.name}.mp4")
                
                if (VideoProcessor.renderSubtitles(videoFile, subFile, outputFile)) {
                    saveVideoToGallery(outputFile, "AutoSub_${project.name}_${System.currentTimeMillis()}.mp4")
                    lastRenderedPath = outputFile.absolutePath
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                isProcessing = false
            }
        }
    }

    private fun saveVideoToGallery(videoFile: File, fileName: String) {
        val context = getApplication<Application>()
        val values = android.content.ContentValues().apply {
            put(android.provider.MediaStore.Video.Media.DISPLAY_NAME, fileName)
            put(android.provider.MediaStore.Video.Media.MIME_TYPE, "video/mp4")
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                put(android.provider.MediaStore.Video.Media.RELATIVE_PATH, "Movies/AutoSubtitles")
            }
        }

        val uri = context.contentResolver.insert(android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values)
        uri?.let {
            context.contentResolver.openOutputStream(it)?.use { outputStream ->
                videoFile.inputStream().use { inputStream ->
                    inputStream.copyTo(outputStream)
                }
            }
        }
    }

    fun clearLastRenderedPath() {
        lastRenderedPath = null
    }

    private fun getLocalPathFromUri(uriString: String): File? {
        val uri = android.net.Uri.parse(uriString)
        if (uri.scheme == "file") return File(uri.path!!)
        
        val cacheDir = getApplication<Application>().cacheDir
        val tempFile = File(cacheDir, "temp_video_${System.currentTimeMillis()}.mp4")
        
        return try {
            getApplication<Application>().contentResolver.openInputStream(uri)?.use { input ->
                tempFile.outputStream().use { output ->
                    input.copyTo(output)
                }
            }
            tempFile
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun formatSrtTime(seconds: Double): String {
        val totalMs = (seconds * 1000).toLong()
        val h = totalMs / 3600000
        val m = (totalMs % 3600000) / 60000
        val s = (totalMs % 60000) / 1000
        val ms = totalMs % 1000
        return String.format("%02d:%02d:%02d,%03d", h, m, s, ms)
    }

    fun translateSubtitles(targetLang: String) {
        val project = currentProject ?: return
        viewModelScope.launch {
            isProcessing = true
            try {
                val texts = project.subtitles.map { it.text }
                val translatedTexts = translationManager.translateSubtitles(texts, targetLang = targetLang)
                
                val updatedSubs = project.subtitles.mapIndexed { index, sub ->
                    sub.copy(text = translatedTexts[index])
                }
                updateSubtitles(updatedSubs)
            } finally {
                isProcessing = false
            }
        }
    }

    fun updateSubtitles(newSubtitles: List<SubtitleItem>) {
        currentProject = currentProject?.copy(subtitles = newSubtitles)?.also {
            repository.saveProject(it)
        }
        loadProjects()
    }

    fun deleteProject(projectId: String) {
        repository.deleteProject(projectId)
        loadProjects()
        if (currentProject?.id == projectId) {
            currentProject = null
        }
    }
}
