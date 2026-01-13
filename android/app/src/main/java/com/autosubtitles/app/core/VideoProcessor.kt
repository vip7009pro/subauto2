package com.autosubtitles.app.core

import com.arthenica.ffmpegkit.FFmpegKit
import com.arthenica.ffmpegkit.ReturnCode
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

/**
 * Handles all video processing tasks using FFmpegKit.
 */
object VideoProcessor {

    /**
     * Extracts audio from a video file into a WAV format for transcription.
     */
    suspend fun extractAudio(videoFile: File, outputFile: File): Boolean = withContext(Dispatchers.IO) {
        val cmd = "-i \"${videoFile.absolutePath}\" -ar 16000 -ac 1 -c:a pcm_s16le \"${outputFile.absolutePath}\" -y"
        val session = FFmpegKit.execute(cmd)
        ReturnCode.isSuccess(session.returnCode)
    }

    /**
     * Renders video with burned-in subtitles.
     * @param videoFile Original video
     * @param subtitleFile ASS or SRT subtitle file
     * @param outputFile Destination path
     */
    suspend fun renderSubtitles(videoFile: File, subtitleFile: File, outputFile: File): Boolean = withContext(Dispatchers.IO) {
        // We use the 'subtitles' filter for hardcoding. 
        // Note: For ASS, use 'ass=' instead.
        val filter = if (subtitleFile.extension == "ass") {
            "ass='${subtitleFile.absolutePath}'"
        } else {
            "subtitles='${subtitleFile.absolutePath}'"
        }
        
        val cmd = "-i \"${videoFile.absolutePath}\" -vf \"$filter\" -c:a copy \"${outputFile.absolutePath}\" -y"
        val session = FFmpegKit.execute(cmd)
        ReturnCode.isSuccess(session.returnCode)
    }
}
