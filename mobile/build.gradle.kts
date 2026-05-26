import java.io.File

// Top-level build file where you can add configuration options common to all sub-projects/modules.

val externalBuildDir = File(System.getenv("LOCALAPPDATA") ?: System.getProperty("user.home"), ".medigo-build/mobile")

buildDir = externalBuildDir

subprojects {
    buildDir = File(externalBuildDir, name)
}

plugins {
    alias(libs.plugins.androidApplication) apply false
    alias(libs.plugins.jetbrainsKotlinAndroid) apply false
}