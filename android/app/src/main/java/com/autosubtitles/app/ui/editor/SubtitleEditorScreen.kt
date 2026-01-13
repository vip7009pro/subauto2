package com.autosubtitles.app.ui.editor

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.autosubtitles.app.model.SubtitleItem

@Composable
fun SubtitleEditorScreen(
    videoUri: String,
    subtitles: List<SubtitleItem>,
    onSubtitleChange: (Int, String) -> Unit,
    onRenderClick: () -> Unit
) {
    var isProcessing by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Project Editor", style = MaterialTheme.typography.headlineMedium)
        
        Spacer(modifier = Modifier.height(8.dp))

        // Native Video Player
        com.autosubtitles.app.ui.components.VideoPlayer(videoUri = videoUri)
        
        Spacer(modifier = Modifier.height(16.dp))
        
        if (isProcessing) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            Text("Processing AI Subtitles...", style = MaterialTheme.typography.bodySmall)
        }

        LazyColumn(modifier = Modifier.weight(1f)) {
            itemsIndexed(subtitles) { index, item ->
                SubtitleRow(item) { newText ->
                    onSubtitleChange(index, newText)
                }
            }
        }
        
        Button(
            onClick = onRenderClick,
            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
        ) {
            Text("Render Video")
        }
    }
}

@Composable
fun SubtitleRow(item: SubtitleItem, onTextChange: (String) -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Column(modifier = Modifier.padding(8.dp)) {
            Text("${formatTime(item.start)} - ${formatTime(item.end)}", style = MaterialTheme.typography.labelSmall)
            TextField(
                value = item.text,
                onValueChange = onTextChange,
                modifier = Modifier.fillMaxWidth(),
                variant = "standard" // Simplified
            )
        }
    }
}

fun formatTime(seconds: Double): String {
    val totalMs = (seconds * 1000).toInt()
    val mm = (totalMs / 60000).toString().padStart(2, '0')
    val ss = ((totalMs % 60000) / 1000).toString().padStart(2, '0')
    val ms = (totalMs % 1000).toString().padStart(3, '0')
    return "$mm:$ss.$ms"
}

// Extension to simulate standard TextField variant in Compose
@Composable
fun TextField(value: String, onValueChange: (String) -> Unit, modifier: Modifier, variant: String) {
    androidx.compose.material3.TextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier,
        colors = TextFieldDefaults.colors(
            focusedContainerColor = androidx.compose.ui.graphics.Color.Transparent,
            unfocusedContainerColor = androidx.compose.ui.graphics.Color.Transparent
        )
    )
}
