@echo off
set "T=%time: =0%"
set "T=%T::=%"
set "T=%T:,=%"
set "T=%T:.=%"
set "P=%~dp0index.html"
set "P=%P:\=/%"
start "" "file:///%P%?v=%T%"
