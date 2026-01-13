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
                            onAddProject = { 
                                // Mock picking: In real app use ActivityResultLauncher for video/PICK
                                viewModel.createProject("Sample Video", "/sdcard/video.mp4", 60000) 
                            }
                        )
                    } else {
                        SubtitleEditorScreen(
                            videoUri = currentProject.videoUri,
                            subtitles = currentProject.subtitles,
                            onSubtitleChange = { index, text ->
                                val updated = currentProject.subtitles.toMutableList()
                                updated[index] = updated[index].copy(text = text)
                                viewModel.updateSubtitles(updated)
                            },
                            onRenderClick = { /* Handle render logic */ }
                        )
                        
                        androidx.activity.compose.BackHandler {
                            viewModel.selectProject(null)
                        }
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
