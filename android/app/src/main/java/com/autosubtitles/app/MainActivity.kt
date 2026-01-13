package com.autosubtitles.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.autosubtitles.app.ui.theme.AutoSubtitlesAppTheme

import androidx.lifecycle.viewmodel.compose.viewModel
import com.autosubtitles.app.ui.main.MainScreen
import com.autosubtitles.app.ui.editor.SubtitleEditorScreen
import com.autosubtitles.app.ui.viewmodel.ProjectViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AutoSubtitlesAppTheme {
                val viewModel: ProjectViewModel = viewModel()
                
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val currentProject = viewModel.currentProject
                    
                    if (currentProject == null) {
                        MainScreen(
                            projects = viewModel.projects,
                            onProjectClick = { viewModel.selectProject(it) },
                            onDeleteProject = { viewModel.deleteProject(it) },
                            onAddProject = { name, uri -> 
                                viewModel.createProject(name, uri, 0) 
                            }
                        )
                    } else {
                        SubtitleEditorScreen(
                            project = currentProject,
                            isProcessing = viewModel.isProcessing,
                            onSubtitleChange = { index: Int, text: String ->
                                val updated = currentProject.subtitles.toMutableList()
                                updated[index] = updated[index].copy(text = text)
                                viewModel.updateSubtitles(updated)
                            },
                            onStyleChange = { style: com.autosubtitles.app.model.SubtitleStyle ->
                                val updated = currentProject.subtitles.map { it.copy(style = style) }
                                viewModel.updateSubtitles(updated)
                            },
                            onRenderClick = { viewModel.startRendering() },
                            onBack = { viewModel.selectProject(null) },
                            onTranscribeClick = { viewModel.startTranscription() },
                            onTranslateClick = { lang: String -> viewModel.translateSubtitles(lang) },
                            lastRenderedPath = viewModel.lastRenderedPath,
                            onClearRenderedPath = { viewModel.clearLastRenderedPath() },
                            selectedModel = viewModel.selectedModel,
                            onModelSelect = { viewModel.setModel(it) },
                            isModelDownloaded = { viewModel.isModelDownloaded(it) },
                            onDownloadModel = { viewModel.downloadModel(it) },
                            modelDownloadProgress = viewModel.modelDownloadProgress
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(
        text = "Hello $name!",
        modifier = modifier
    )
}
