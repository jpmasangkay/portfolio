$ErrorActionPreference = "Stop"

$in = "c:\Users\Asahi\Downloads\CV - SHealtiel John Paul A. Masangkay.docx"
$out = "D:\Programming\React Projects\portfolio\_tmp_resume.txt"

$word = $null
$doc = $null

try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $doc = $word.Documents.Open($in, $false, $true)
  $text = $doc.Content.Text

  Set-Content -Path $out -Value $text -Encoding UTF8
  Write-Output $out
}
finally {
  if ($doc) { $doc.Close() | Out-Null }
  if ($word) { $word.Quit() | Out-Null }
  if ($doc) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) }
  if ($word) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) }
}

