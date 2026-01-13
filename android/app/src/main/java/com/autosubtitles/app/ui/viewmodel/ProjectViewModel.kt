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
                // 1. Extract audio (simplified: assuming we have a file path from Uri)
                val videoFile = File(project.videoUri)
                val audioFile = File(getApplication<Application>().cacheDir, "${project.id}.wav")
                
                if (VideoProcessor.extractAudio(videoFile, audioFile)) {
                    // 2. Transcribe
                    val subs = whisperEngine.transcribe(audioFile)
                    updateSubtitles(subs)
                }
            } finally {
                isProcessing = false
            }
        }
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
