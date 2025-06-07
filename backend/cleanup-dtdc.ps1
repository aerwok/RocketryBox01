#!/usr/bin/env pwsh

# MongoDB DTDC Cleanup Script
# This script removes all DTDC-related data from MongoDB

Write-Host "Starting DTDC Data Cleanup..." -ForegroundColor Yellow

# MongoDB connection string (adjust if needed)
$mongoConnection = "mongodb://localhost:27017/rocketrybox"

Write-Host "Connecting to MongoDB..." -ForegroundColor Cyan

try {
    # Remove DTDC rate cards
    Write-Host "Removing DTDC rate cards..." -ForegroundColor Red
    mongo $mongoConnection --eval "db.ratecards.deleteMany({courier: /DTDC/i})"
    mongo $mongoConnection --eval "db.ratecards.deleteMany({courier: /Dtdc/i})"

    # Remove DTDC shipping partners
    Write-Host "Removing DTDC shipping partners..." -ForegroundColor Red
    mongo $mongoConnection --eval "db.shippingpartners.deleteMany({name: /DTDC/i})"
    mongo $mongoConnection --eval "db.shippingpartners.deleteMany({name: /Dtdc/i})"

    # Remove DTDC seller rate cards
    Write-Host "Removing DTDC seller rate cards..." -ForegroundColor Red
    mongo $mongoConnection --eval "db.sellerratecards.deleteMany({courier: /DTDC/i})"
    mongo $mongoConnection --eval "db.sellerratecards.deleteMany({courier: /Dtdc/i})"

    # Remove DTDC shipping charges
    Write-Host "Removing DTDC shipping charges..." -ForegroundColor Red
    mongo $mongoConnection --eval "db.shippingcharges.deleteMany({courier: /DTDC/i})"
    mongo $mongoConnection --eval "db.shippingcharges.deleteMany({courier: /Dtdc/i})"

    # Check for any remaining DTDC data
    Write-Host "Checking for remaining DTDC references..." -ForegroundColor Cyan

    $remainingRateCards = mongo $mongoConnection --eval "db.ratecards.countDocuments({courier: /DTDC/i})" --quiet
    $remainingPartners = mongo $mongoConnection --eval "db.shippingpartners.countDocuments({name: /DTDC/i})" --quiet
    $remainingSellerCards = mongo $mongoConnection --eval "db.sellerratecards.countDocuments({courier: /DTDC/i})" --quiet
    $remainingCharges = mongo $mongoConnection --eval "db.shippingcharges.countDocuments({courier: /DTDC/i})" --quiet

        Write-Host "Cleanup Results:" -ForegroundColor Green
    Write-Host "   • Rate Cards: $remainingRateCards remaining" -ForegroundColor White
    Write-Host "   • Shipping Partners: $remainingPartners remaining" -ForegroundColor White
    Write-Host "   • Seller Rate Cards: $remainingSellerCards remaining" -ForegroundColor White
    Write-Host "   • Shipping Charges: $remainingCharges remaining" -ForegroundColor White

    if ($remainingRateCards -eq 0 -and $remainingPartners -eq 0 -and $remainingSellerCards -eq 0 -and $remainingCharges -eq 0) {
        Write-Host "DTDC cleanup completed successfully! All DTDC data removed." -ForegroundColor Green
    } else {
        Write-Host "Some DTDC data may still remain. Please check manually." -ForegroundColor Yellow
    }

} catch {
    Write-Host "Error during cleanup: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please ensure MongoDB is running and accessible." -ForegroundColor Yellow
}

Write-Host "Cleanup script finished." -ForegroundColor Cyan
