$ErrorActionPreference = 'Stop'
$project = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
$cases = @(
  @{ Name='lab-corners'; Url='http://127.0.0.1:5173/?view=lab&fixture=0' },
  @{ Name='lab-junctions'; Url='http://127.0.0.1:5173/?view=lab&fixture=1' },
  @{ Name='lab-pillars'; Url='http://127.0.0.1:5173/?view=lab&fixture=2' },
  @{ Name='lab-boundary'; Url='http://127.0.0.1:5173/?view=lab&fixture=3' },
  @{ Name='boss-preview'; Url='http://127.0.0.1:5173/?view=assets&asset=Characters%2FMonster%2FBossMonster_walk_front.png' }
)
foreach ($case in $cases) {
  $argsList = @('--headless','--disable-gpu','--no-first-run','--no-default-browser-check',"--user-data-dir=$project/.browser-qa/$($case.Name)","--screenshot=$project/docs/$($case.Name).png",'--window-size=1440,1100','--virtual-time-budget=2500',$case.Url)
  Start-Process -FilePath $chrome -ArgumentList $argsList -WindowStyle Hidden -Wait
  Write-Output $case.Name
}
$argsList = @('--headless','--disable-gpu','--no-first-run','--no-default-browser-check',"--user-data-dir=$project/.browser-qa/interaction",'--dump-dom','--window-size=1440,1100','--virtual-time-budget=25000','http://127.0.0.1:5173/tools/browser-qa.html')
Start-Process -FilePath $chrome -ArgumentList $argsList -WindowStyle Hidden -Wait -RedirectStandardOutput "$project/docs/browser-qa-result.html"
$report = [System.IO.File]::ReadAllText("$project/docs/browser-qa-result.html")
if (-not $report.Contains('<pre id="results">ALL PASS')) { throw 'Browser QA failed or did not finish. See docs/browser-qa-result.html' }
Write-Output 'Browser QA complete'
