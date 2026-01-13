package com.autosubtitles.app.core

import android.content.Context
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.TranslatorOptions
import kotlinx.coroutines.tasks.await

/**
 * Manages offline translation using ML Kit.
 */
class TranslationManager(private val context: Context) {

    /**
     * Translates a list of strings from source to target language.
     */
    suspend fun translateSubtitles(
        texts: List<String>,
        sourceLang: String = TranslateLanguage.ENGLISH,
        targetLang: String = TranslateLanguage.VIETNAMESE
    ): List<String> {
        val options = TranslatorOptions.Builder()
            .setSourceLanguage(sourceLang)
            .setTargetLanguage(targetLang)
            .build()
        
        val translator = Translation.getClient(options)
        
        // Ensure model is downloaded
        val conditions = DownloadConditions.Builder()
            .requireWifi()
            .build()
        
        translator.downloadModelIfNeeded(conditions).await()
        
        return texts.map { text ->
            try {
                translator.translate(text).await()
            } catch (e: Exception) {
                text // Fallback to original
            }
        }
    }
    
    // Note: In a real app, you'd want to manage model deletion and progress tracking.
}
