package com.autosubtitles.app.data

import android.content.Context
import com.autosubtitles.app.model.Project
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.io.File

/**
 * Manages local storage for subtitle projects.
 */
class ProjectRepository(private val context: Context) {
    private val gson = Gson()
    private val projectsFile = File(context.filesDir, "projects.json")

    fun getAllProjects(): List<Project> {
        if (!projectsFile.exists()) return emptyList()
        return try {
            val json = projectsFile.readText()
            val type = object : TypeToken<List<Project>>() {}.type
            gson.fromJson(json, type)
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun saveProject(project: Project) {
        val projects = getAllProjects().toMutableList()
        val index = projects.indexOfFirst { it.id == project.id }
        if (index != -1) {
            projects[index] = project
        } else {
            projects.add(0, project)
        }
        projectsFile.writeText(gson.toJson(projects))
    }

    fun deleteProject(projectId: String) {
        val projects = getAllProjects().filter { it.id != projectId }
        projectsFile.writeText(gson.toJson(projects))
    }

    // Model Preferences
    private val prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)

    fun getSelectedModel(): com.autosubtitles.app.model.AiModel {
        val name = prefs.getString("selected_model", com.autosubtitles.app.model.AiModel.TINY.name)
        return com.autosubtitles.app.model.AiModel.valueOf(name!!)
    }

    fun setSelectedModel(model: com.autosubtitles.app.model.AiModel) {
        prefs.edit().putString("selected_model", model.name).apply()
    }
}
