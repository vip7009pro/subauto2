package com.autosubtitles.app.ui.editor

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.autosubtitles.app.model.SubtitleStyle

@Composable
fun StyleDialog(
    currentStyle: SubtitleStyle,
    onStyleChange: (SubtitleStyle) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Style Studio") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                // Font Size
                Column {
                    Text("Font Size: ${currentStyle.fontSize}", style = MaterialTheme.typography.labelMedium)
                    Slider(
                        value = currentStyle.fontSize.toFloat(),
                        onValueChange = { onStyleChange(currentStyle.copy(fontSize = it.toInt())) },
                        valueRange = 12f..64f
                    )
                }

                // Background Opacity
                Column {
                    Text("Background Opacity: ${(currentStyle.bgOpacity * 100).toInt()}%", style = MaterialTheme.typography.labelMedium)
                    Slider(
                        value = currentStyle.bgOpacity,
                        onValueChange = { onStyleChange(currentStyle.copy(bgOpacity = it)) },
                        valueRange = 0f..1f
                    )
                }

                // Quick Colors
                Text("Theme Colors", style = MaterialTheme.typography.labelMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    val colors = listOf(Color.White, Color.Yellow, Color.Cyan, Color(0xFF00FF00))
                    colors.forEach { color ->
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .backgroundWithShape(color, MaterialTheme.shapes.small)
                                .clickable { 
                                    onStyleChange(currentStyle.copy(textColor = String.format("#%06X", 0xFFFFFF and color.value.toInt()))) 
                                }
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = onDismiss) { Text("Done") }
        }
    )
}

// Extension for background modifier with shape
fun Modifier.backgroundWithShape(color: Color, shape: androidx.compose.ui.graphics.Shape) = this
    .clip(shape)
    .background(color)
