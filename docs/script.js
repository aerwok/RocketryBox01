// Fetch rate data from the rate.json file
fetch('rate.json')
    .then(response => response.json())
    .then(data => {
        rateData = data;
        populateRateTable(data);
    })
    .catch(error => {
        console.error('Error loading JSON:', error);
        alert("Error loading rate data.");
    });

// Populate rate data in table
function populateRateTable(data) {
    const tbody = document.querySelector('#rateTable tbody');
    data.forEach(item => {
        const row = document.createElement('tr');

        // Courier column with logo
        const courierCell = document.createElement('td');
        const courierLogo = document.createElement('img');
        courierLogo.src = item["logo"]; // Set the logo image source
        courierLogo.alt = item["Courier"]; // Set alt text for accessibility
        courierLogo.style.width = "40px";  // Set a fixed width for the logo
        courierLogo.style.height = "40px"; // Set a fixed height for the logo
        courierLogo.style.objectFit = "contain"; // Ensure the logo fits well
        courierCell.appendChild(courierLogo); // Append the logo to the cell
        row.appendChild(courierCell);

        // Product Name column
        const productNameCell = document.createElement('td');
        productNameCell.textContent = item["Product Name"];
        row.appendChild(productNameCell);

        // Mode column
        const ModeCell = document.createElement('td');
        ModeCell.textContent = item["Mode"];
        row.appendChild(ModeCell);

        // COD column
        const codAmountCell = document.createElement('td');
        codAmountCell.textContent = item["codAmount"];
        row.appendChild(codAmountCell);

        // COD % column
        const codPercentCell = document.createElement('td');
        codPercentCell.textContent = item["codPercent"];
        row.appendChild(codPercentCell);

        // MCW column
        const minimumBillableWeightCell = document.createElement('td');
        minimumBillableWeightCell.textContent = item["minimumBillableWeight"];
        row.appendChild(minimumBillableWeightCell);

        // Mapping data to table cells based on the new structure
        const zones = [
            'WITHIN CITY', 'WITHIN STATE', 'WITHIN REGION', 'METRO TO METRO', 'REST OF INDIA', 'Special Zone'
        ];

        zones.forEach(zone => {
            const zoneData = item[zone] || {};
            ['Base', 'Additional', 'RTO'].forEach(field => {
                const cell = document.createElement('td');
                cell.textContent = zoneData[field] || ''; // Default to empty if data is missing
                row.appendChild(cell);
            });
        });

        // Append the row to the table body
        tbody.appendChild(row);
    });
}

// Rate Calculator
fetch('./pincode.json') // Replace with the correct path to your pincode JSON data
    .then(response => response.json())
    .then(data => {
    pincodeMappings = data;
})
.catch(error => {
    console.error("Error loading pincode data:", error);
    alert("Error loading PIN code data.");
});

// Load rate card data for calculator 
fetch('./ratecard.json') // Replace with the correct path to your rate card JSON data
    .then(response => response.json())
    .then(data => {
    rateData = data;
})
.catch(error => {
    console.error("Error loading rate card:", error);
    alert("Error loading rate card data.");
});

// Toggle visibility of COD collectable amount field
function togglecodCollectableAmountField() {
    const orderType = document.getElementById("orderType").value;
    const codCollectableAmountField = document.getElementById("codCollectableAmountField");
    const includeRTOContainer = document.getElementById("includeRTO").parentElement;

    if (orderType === "cod") {
        codCollectableAmountField.style.display = "block";
        includeRTOContainer.style.display = "none";
    } else {
        codCollectableAmountField.style.display = "none";
        includeRTOContainer.style.display = "block";
    }
}

    // Calculate and display shipping rates
    function calculateRate() {
    const pickupPincode = document.getElementById("pickupPincode").value;
    const deliveryPincode = document.getElementById("deliveryPincode").value;
    const weight = parseFloat(document.getElementById("weight").value);
    const length = parseFloat(document.getElementById("length").value);
    const width = parseFloat(document.getElementById("width").value);
    const height = parseFloat(document.getElementById("height").value);
    const orderType = document.getElementById("orderType").value;
    const includeRTO = document.getElementById("includeRTO").checked;
    const codCollectableAmount = parseFloat(document.getElementById("codCollectableAmount").value || 0);

    // Validate Inputs
    if (!pickupPincode || !deliveryPincode || isNaN(weight) || isNaN(length) || isNaN(width) || isNaN(height)) {
        alert("Please fill in all required fields.");
        return;
    }

    // Calculate volumetric weight
    const volumetricWeight = (length * width * height) / 5000;
    const billedWeight = Math.max(weight, volumetricWeight);

    // Get pickup and delivery zones
    const pickupData = pincodeMappings[pickupPincode];
    const deliveryData = pincodeMappings[deliveryPincode];
    if (!pickupData || !deliveryData) {
        alert("Invalid PIN code(s). Please enter valid PIN codes.");
        return;
    }

    const zone = determineZone(pickupData, deliveryData);

    // Filter rate data for the determined zone
    const applicableRates = rateData.filter(rate => rate.zone === zone);

    if (!applicableRates.length) {
        alert("No matching courier found for the selected zone.");
        return;
    }

    const results = applicableRates.map(rate => {
        const finalWeight = Math.max(billedWeight, rate.minimumBillableWeight || 0.5);

        const weightMultiplier = Math.ceil(finalWeight / 0.5);
        const shippingCost = rate.baseRate + (rate.addlRate * (weightMultiplier - 1));

        let rtoCharges = 0;
        if (includeRTO && rate.rtoCharges) {
            rtoCharges = rate.rtoCharges * weightMultiplier;
        }

        let codCharges = 0;
        if (orderType === "cod") {
            if (rate.codAmount && !isNaN(rate.codAmount) && rate.codAmount > 0) {
                // Use fixed COD Amount from rate card
                codCharges = rate.codAmount;
            } else if (rate.codPercent && !isNaN(rate.codPercent) && codCollectableAmount > 0) {
                // COD Percentage of COD Collectable Amount
                codCharges = (rate.codPercent / 100) * codCollectableAmount;
            } else {
                // Fallback if neither fixed COD amount nor valid COD percentage is available
                console.error("Invalid COD charge data: Either codAmount or codPercent is required.");
                codCharges = 0; // Default to 0 if invalid
            }

            // Calculate the COD based on whichever is higher between codAmount or codPercent of codCollectableAmount
            const percentBasedCOD = rate.codPercent && !isNaN(rate.codPercent) && codCollectableAmount > 0 ? (rate.codPercent / 100) * codCollectableAmount : 0;

            // Ensure codCharges is the higher value between codAmount and codPercent-based COD
            codCharges = Math.max(codCharges, percentBasedCOD);
        }

        // Ensure codCharges is a number and parse it to float
        codCharges = isNaN(codCharges) ? 0 : parseFloat(codCharges);

        const gst = 0.18 * (shippingCost + rtoCharges + codCharges);
        const total = shippingCost + rtoCharges + codCharges + gst;

        return {
            courier: rate.courier,
            productName: rate.productName,
            mode: rate.mode,
            zone,
            volumetricWeight: volumetricWeight.toFixed(2),
            finalWeight: finalWeight.toFixed(2),
            shippingCost: shippingCost.toFixed(2),
            codCharges: codCharges.toFixed(2),
            rtoCharges: rtoCharges.toFixed(2),
            gst: gst.toFixed(2),
            total: total.toFixed(2)
        };
    });

    displayRates(results);
}

// Determine zone
function determineZone(pickupData, deliveryData) {
    let zone = '';
    if (deliveryData.state === "Assam" || deliveryData.state === "Nagaland" || deliveryData.state === "Sikkim" 
        || deliveryData.state === "Arunachal Pradesh" || deliveryData.state === "Manipur" || deliveryData.state === "Meghalaya"
        || deliveryData.state === "Mizoram" || deliveryData.state === "Tripura" || deliveryData.state === "Jammu And Kashmir"
        || deliveryData.state === "Himachal Pradesh" || deliveryData.state === "Andaman And Nicobar") {
        zone = "Special Zone"; // Special Zone Logic
    } else if (pickupData.city === deliveryData.city) {
        zone = "Within City";
    } else if (pickupData.state === deliveryData.state) {
        zone = "Within State";
    } else if (pickupData.region === deliveryData.region) {
        zone = "Within Region";
    } else if (
        (pickupData.city === "New Delhi" || pickupData.city === "Mumbai" || pickupData.city === "Kolkata"
            || pickupData.city === "Chennai" || pickupData.city === "Bangalore")
        && (deliveryData.city === "New Delhi" || deliveryData.city === "Mumbai" || deliveryData.city === "Kolkata"
            || deliveryData.city === "Chennai" || deliveryData.city === "Bangalore")) {
        zone = "Metro TO Metro";
    } else {
        zone = "Rest of India";
    }
    return zone;
}

// Display Rates in Modal
function displayRates(rates) {
    const modal = document.getElementById("ratesModal");
    const tableBody = document.querySelector("#ratePopupTable tbody");

    // Clear any existing rows in the table
    tableBody.innerHTML = '';

    // Populate the modal table with the calculated rates
    rates.forEach(rate => {
        const row = document.createElement('tr');
        
        // Add each value as a table cell
        Object.values(rate).forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });

    // Show the modal
    modal.style.display = "block";
}

// Close the modal
function closeModal() {
    const modal = document.getElementById("ratesModal");
    modal.style.display = "none";
}

// Close the modal if clicked outside the modal content
window.onclick = function(event) {
    const modal = document.getElementById("ratesModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
}


//Dashboard

 // Chart.js configuration for Orders
        const ctx = document.getElementById('ordersChart').getContext('2d');
        const ordersChart = new Chart(ctx, {
            type: 'line', // You can use 'bar', 'line', 'pie', etc.
            data: {
                labels: ['January', 'February', 'March', 'April', 'May', 'June'], // X-axis labels
                datasets: [{
                    label: 'Orders Processed',
                    data: [12, 19, 3, 5, 2, 3], // Example data
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        enabled: true,
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Months'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Orders'
                        }
                    }
                }
            }
        });


        document.addEventListener("DOMContentLoaded", function() {
            const currentPath = window.location.pathname.split("/").pop();
            const links = document.querySelectorAll('.rocket-menu a');
        
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href === currentPath) {
                    link.classList.add('active');
                }
            });
        });

        // Wallet Recharge Functionality
document.addEventListener("DOMContentLoaded", function() {
    const rechargeButton = document.querySelector(".wallet-recharge");

    if (rechargeButton) {
        rechargeButton.addEventListener("click", function() {
            const rechargeAmount = prompt("Enter the amount to recharge your wallet (₹):", "500");
    
            if (!rechargeAmount || isNaN(rechargeAmount) || rechargeAmount <= 0) {
                alert("Please enter a valid amount.");
                return;
            }
    
            // Call Razorpay payment gateway (adjust as needed)
            const options = {
                key: "rzp_test_MrhgAPahKBLYCW", // Your Razorpay key
                amount: rechargeAmount * 100, // Amount in paise
                currency: "INR",
                name: "Rocketry Box",
                description: "Wallet Recharge",
                handler: function(response) {
                    alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
                    updateWalletBalance(rechargeAmount);
                },
                prefill: {
                    name: "User Name",
                    email: "user@example.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#F37254"
                }
            };
    
            const razorpay = new Razorpay(options);
            razorpay.open();
        });
    }

    function updateWalletBalance(amount) {
        const walletElement = document.querySelector(".wallet-balance");
        if (walletElement) {
            const currentBalance = parseFloat(walletElement.innerText) || 0;
            walletElement.innerText = (currentBalance + parseFloat(amount)).toFixed(2);
        }
    }
});
