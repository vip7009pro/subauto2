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
    
    var projects by mutableStateOf<List<Project>>(emptyList())
        private set
    
    var currentProject by mutableStateOf<Project?>(null)
        private set

    var isProcessing by mutableStateOf(false)
        private set

    init {
        loadProjects()
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
                    val subs = whisperEngine.transcribe(audioFile)
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
                    // Success logic
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                isProcessing = false
            }
        }
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
