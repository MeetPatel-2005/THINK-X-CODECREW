# RAG API Testing Script for PowerShell
# Make sure the server is running on localhost:3000

Write-Host "🚀 Testing RAG API Endpoints" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Test 1: Health Check / Query Only (without upload)
Write-Host "`n📋 Test 1: Query Existing Database (Chat Endpoint)" -ForegroundColor Yellow
try {
    $queryBody = @{
        query = "What are the admission requirements?"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method POST -ContentType "application/json" -Body $queryBody
    Write-Host "✅ Response:" -ForegroundColor Green
    Write-Host $response.answer -ForegroundColor White
    Write-Host "Source: $($response.source)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Upload PDFs Only (no query)
Write-Host "`n📁 Test 2: Upload PDF Only" -ForegroundColor Yellow
Write-Host "Note: Replace 'sample.pdf' with your actual PDF path" -ForegroundColor Gray
Write-Host "Example command:" -ForegroundColor Gray
Write-Host 'curl -X POST http://localhost:3000/api/files/upload -F "files=@C:\path\to\your\placement-policy.pdf"' -ForegroundColor DarkGray

# Test 3: Upload + Query Combined
Write-Host "`n📋📁 Test 3: Upload PDF + Query" -ForegroundColor Yellow
Write-Host "Note: Replace 'sample.pdf' with your actual PDF path" -ForegroundColor Gray
Write-Host "Example command:" -ForegroundColor Gray
Write-Host 'curl -X POST http://localhost:3000/api/files/upload-and-query -F "files=@C:\path\to\your\placement-policy.pdf" -F "query=What is the placement policy?"' -ForegroundColor DarkGray

Write-Host "`n🔍 Sample Test Queries:" -ForegroundColor Magenta
Write-Host "- What are the placement procedures?" -ForegroundColor White
Write-Host "- Tell me about eligibility criteria" -ForegroundColor White  
Write-Host "- What documents are required for placement?" -ForegroundColor White
Write-Host "- Explain the placement process timeline" -ForegroundColor White

Write-Host "`n📝 Testing Complete!" -ForegroundColor Green