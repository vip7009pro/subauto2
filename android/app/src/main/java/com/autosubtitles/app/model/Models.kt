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
