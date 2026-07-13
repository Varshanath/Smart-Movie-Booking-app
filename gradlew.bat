@echo off
setlocal
set DIR=%~dp0
if "%~1"=="" (
  echo Usage: gradlew.bat [task]
  exit /b 1
)
java -classpath "%DIR%gradle-wrapper\lib\gradle-wrapper-*.jar" org.gradle.wrapper.GradleWrapperMain %*
