@echo off
setlocal
set DIR=%~dp0
if "%~1"=="" (
  echo Usage: gradlew.bat [task]
  exit /b 1
)
java -classpath "%DIR%gradle\wrapper\gradle-wrapper.jar;%DIR%gradle\wrapper\gradle-wrapper-shared.jar" org.gradle.wrapper.GradleWrapperMain %*
