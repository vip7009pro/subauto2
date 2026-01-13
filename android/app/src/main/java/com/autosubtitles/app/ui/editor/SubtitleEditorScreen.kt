package com.autosubtitles.app.ui.editor

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.autosubtitles.app.model.Project
import com.autosubtitles.app.model.SubtitleItem

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubtitleEditorScreen(
    project: Project,
    isProcessing: Boolean,
    onSubtitleChange: (Int, String) -> Unit,
    onStyleChange: (com.autosubtitles.app.model.SubtitleStyle) -> Unit = {},
    onRenderClick: () -> Unit,
    onBack: () -> Unit,
    onTranscribeClick: () -> Unit = {},
    onTranslateClick: (String) -> Unit = {}
) {
    var showStyleDialog by remember { mutableStateOf(false) }

    if (showStyleDialog) {
        StyleDialog(
            currentStyle = project.subtitles.firstOrNull()?.style ?: com.autosubtitles.app.model.SubtitleStyle(),
            onStyleChange = onStyleChange,
            onDismiss = { showStyleDialog = false }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(project.name, style = MaterialTheme.typography.titleMedium) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Back") }
                },
                actions = {
                    IconButton(onClick = { showStyleDialog = true }) { Icon(Icons.Default.Palette, "Style") }
                    IconButton(onClick = onTranscribeClick) { Icon(Icons.Default.AutoFixHigh, "Transcribe") }
                    IconButton(onClick = { onTranslateClick("vi") }) { Icon(Icons.Default.Translate, "Translate") }
                }
            )
        },
        bottomBar = {
            Surface(tonalElevation = 8.dp) {
                Button(
                    onClick = onRenderClick,
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    shape = MaterialTheme.shapes.medium
                ) {
                    Icon(Icons.Default.Movie, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("Render Final Video")
                }
            }
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            // Video Player Section
            Box(modifier = Modifier.fillMaxWidth().height(240.dp).background(Color.Black)) {
                com.autosubtitles.app.ui.components.VideoPlayer(videoUri = project.videoUri)
            }

            // Processing state
            AnimatedVisibility(visible = isProcessing) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }

            // Subtitle List
            LazyColumn(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (project.subtitles.isEmpty()) {
                    item {
                        EmptySubtitles(onTranscribeClick)
                    }
                } else {
                    itemsIndexed(project.subtitles) { index, item ->
                        SubtitleRow(item) { newText ->
                            onSubtitleChange(index, newText)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SubtitleRow(item: SubtitleItem, onTextChange: (String) -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "${formatTime(item.start)} - ${formatTime(item.end)}", 
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(Modifier.height(4.dp))
            TextField(
                value = item.text,
                onValueChange = onTextChange,
                modifier = Modifier.fillMaxWidth(),
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Color.Transparent,
                    unfocusedContainerColor = Color.Transparent,
                    focusedIndicatorColor = MaterialTheme.colorScheme.primary
                )
            )
        }
    }
}

@Composable
fun EmptySubtitles(onClick: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("No subtitles found", style = MaterialTheme.typography.bodyLarge)
        TextButton(onClick = onClick) {
            Icon(Icons.Default.AutoFixHigh, contentDescription = null)
            Spacer(Modifier.width(8.dp))
            Text("Generate with AI")
        }
    }
}

fun formatTime(seconds: Double): String {
    val totalMs = (seconds * 1000).toInt()
    val mm = (totalMs / 60000).toString().padStart(2, '0')
    val ss = ((totalMs % 60000) / 1000).toString().padStart(2, '0')
    return "$mm:$ss"
}
