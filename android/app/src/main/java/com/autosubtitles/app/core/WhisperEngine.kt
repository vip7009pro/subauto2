package com.autosubtitles.app.core

import android.content.Context
import com.autosubtitles.app.model.SubtitleItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

/**
 * Skeleton for Whisper TFLite transcription.
 * Native library calls would be integrated here.
 */
class WhisperEngine(private val context: Context) {

    private val processor = WhisperProcessor(context)

    /**
     * Transcribes a WAV audio file into subtitle chunks.
     */
    suspend fun transcribe(audioFile: File, modelPath: String): List<SubtitleItem> = withContext(Dispatchers.Default) {
        val modelFile = File(modelPath)
        if (!modelFile.exists()) {
            return@withContext listOf(
                SubtitleItem(start = 0.5, end = 5.0, text = "Model file not found. Please download it first.")
            )
        }

        if (processor.loadModel(modelFile.absolutePath)) {
            val text = processor.transcribe(FloatArray(0))
            listOf(SubtitleItem(start = 0.5, end = 5.0, text = text))
        } else {
            listOf(SubtitleItem(start = 0.5, end = 5.0, text = "Error loading AI Model."))
        }
    }
}
