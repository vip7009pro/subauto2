package com.autosubtitles.app.model

import java.util.UUID

data class SubtitleItem(
    val id: String = UUID.randomUUID().toString(),
    var start: Double,
    var end: Double,
    var text: String,
    var style: SubtitleStyle = SubtitleStyle()
)

data class SubtitleStyle(
    val textColor: String = "#FFFFFF",
    val bgColor: String = "#000000",
    val fontSize: Int = 24,
    val bgOpacity: Float = 0.5f
)

data class Project(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val videoUri: String,
    val duration: Long,
    val subtitles: List<SubtitleItem> = emptyList(),
    val createdAt: Long = System.currentTimeMillis()
)

enum class AiModel(val displayName: String, val fileName: String, val url: String, val sizeMb: Int) {
    TINY("Whisper Tiny (Fastest)", "whisper-tiny.tflite", "https://huggingface.co/RedHatAI/whisper-tiny-quantized.w8a8/resolve/main/whisper-tiny-quantized.tflite", 40),
    SMALL("Whisper Small (Precise)", "whisper-small.tflite", "https://huggingface.co/DocWolle/whisper_tflite_models/resolve/main/whisper-small.tflite", 388)
}
