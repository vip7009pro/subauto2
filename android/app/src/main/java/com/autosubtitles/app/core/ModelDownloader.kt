package com.autosubtitles.app.core

import android.content.Context
import com.autosubtitles.app.model.AiModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.net.URL

class ModelDownloader(private val context: Context) {

    suspend fun download(model: AiModel, onProgress: (Float) -> Unit): Boolean = withContext(Dispatchers.IO) {
        val targetFile = File(context.filesDir, model.fileName)
        
        try {
            val url = URL(model.url)
            val connection = url.openConnection()
            connection.connect()
            
            val fileLength = connection.contentLength
            
            url.openStream().use { input ->
                targetFile.outputStream().use { output ->
                    val data = ByteArray(8192)
                    var total = 0L
                    var count: Int
                    while (input.read(data).also { count = it } != -1) {
                        total += count
                        if (fileLength > 0) {
                            onProgress(total.toFloat() / fileLength)
                        }
                        output.write(data, 0, count)
                    }
                }
            }
            true
        } catch (e: Exception) {
            e.printStackTrace()
            if (targetFile.exists()) targetFile.delete()
            false
        }
    }

    fun isDownloaded(model: AiModel): Boolean {
        return File(context.filesDir, model.fileName).exists()
    }
}
