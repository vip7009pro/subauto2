package com.autosubtitles.app.ui.editor

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.autosubtitles.app.model.AiModel

@Composable
fun ModelSelectionDialog(
    selectedModel: AiModel,
    onModelSelect: (AiModel) -> Unit,
    isDownloaded: (AiModel) -> Boolean,
    onDownload: (AiModel) -> Unit,
    downloadProgress: Float?,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("AI Model Selection") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Higher accuracy models are larger and slower.", style = MaterialTheme.typography.bodySmall)
                Spacer(Modifier.height(8.dp))
                
                AiModel.values().forEach { model ->
                    val downloaded = isDownloaded(model)
                    
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .selectable(
                                selected = (model == selectedModel),
                                onClick = { onModelSelect(model) }
                            )
                            .padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = (model == selectedModel),
                            onClick = { onModelSelect(model) }
                        )
                        Column(modifier = Modifier.weight(1f).padding(start = 8.dp)) {
                            Text(model.displayName, style = MaterialTheme.typography.bodyLarge)
                            Text("${model.sizeMb} MB • ${if (downloaded) "Downloaded" else "Not downloaded"}", style = MaterialTheme.typography.bodySmall)
                        }
                        
                        if (!downloaded) {
                            TextButton(
                                onClick = { onDownload(model) },
                                enabled = downloadProgress == null
                            ) {
                                Text("Download")
                            }
                        }
                    }
                }
                
                if (downloadProgress != null) {
                    Spacer(Modifier.height(16.dp))
                    Text("Downloading: ${(downloadProgress * 100).toInt()}%")
                    LinearProgressIndicator(
                        progress = downloadProgress,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        },
        confirmButton = {
            Button(onClick = onDismiss) { Text("Done") }
        }
    )
}
