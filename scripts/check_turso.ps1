$body = '{"requests":[{"type":"execute","stmt":{"sql":"SELECT name FROM sqlite_master WHERE type=''table''"}}]}'
$headers = @{
  "Authorization" = "Bearer eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODI4OTIxNTIsImlkIjoiMDE5ZjFjYTUtZDAwMS03ODk0LWE5MzQtMTgzM2QzYzVmYTA1Iiwia2lkIjoiYWlDdHFHNFc2bE1VWm1DUDJ6dFJUTWdvcVNzYWJBVjlid0REMm9tSjl1QSIsInJpZCI6IjBkNjM3N2JjLTNiYTctNDljYy04ZDdlLTMxYmU3ZmI4YmM4ZiJ9.Juh9CT_0GcoxEYub9xCdjgh9f7aTG1Px-1gIbGELaD-rKffyDSa95s4LanvkdfD-Baj5VOG9LcK9UmvcNlnUDg"
  "Content-Type" = "application/json"
}
$r = Invoke-RestMethod -Uri "https://jalur-armasuka10.aws-ap-northeast-1.turso.io/v2/pipeline" -Method Post -Headers $headers -Body $body -TimeoutSec 15
$r.results[0].response.result.rows | ForEach-Object { Write-Output $_[0].value }
