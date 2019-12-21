; AutoHotKey Script to start ChromeCast in Desktop Mode
;
; Declare variables
delay := 1000
appDelay := 300
tabs := A_Args[1]
;tabs := 2
; ListVars
; Pause
; Run Chrome
; Run, C:\Program Files (x86)\Google\Chrome\Application\chrome.exe --fullscreen --start-maximized
WinActivate, Backend - Coast to Coast
Sleep, appDelay
Send !f
Sleep, delay
Send c
Sleep, delay
Loop, %tabs%
{
  Send {Tab}
  Sleep, delay
}
Send {Enter}
Sleep, delay
Send {Esc}