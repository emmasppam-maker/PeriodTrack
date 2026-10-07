// =====================================================
// PERIODTRACK - FRONTEND JAVASCRIPT
// =====================================================


// =====================================================
// AWS LAMBDA URL
// =====================================================

const API_URL =
    "https://jabmvtjjsguihgjbmpwksxg3640ijojw.lambda-url.ap-southeast-2.on.aws/";


// =====================================================
// USER ID
// =====================================================

// For now we use one demo user.
// Later you can replace this with a login/user system.
const USER_ID = "demo-user-001";


// =====================================================
// CURRENT CYCLE DATA
// =====================================================

let currentCycleData = null;


// =====================================================
// FORMAT DATE FOR DISPLAY
// =====================================================

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    // Handle YYYY-MM-DD safely
    const parts = dateString.split("-");

    if (parts.length === 3) {

        const year = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const day = Number(parts[2]);

        const date = new Date(
            year,
            month,
            day
        );

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    }

    // Fallback
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


// =====================================================
// GET HISTORY FROM AWS / DYNAMODB
// =====================================================

async function getHistory() {

    try {

        console.log("Loading history from AWS...");

        const response = await fetch(
            `${API_URL}?userId=${encodeURIComponent(USER_ID)}`
        );


        // Check HTTP response
        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );
        }


        const data = await response.json();


        console.log(
            "History received from AWS:",
            data
        );


        // Return history array
        return data.history || [];


    } catch (error) {

        console.error(
            "Error loading history:",
            error
        );


        return [];
    }
}


// =====================================================
// CALCULATE CYCLE
// =====================================================

function calculateCycle() {

    // Get form values
    const lastPeriodValue =
        document.getElementById(
            "lastPeriod"
        ).value;


    const previousPeriodValue =
        document.getElementById(
            "previousPeriod"
        ).value;


    const durationValue =
        document.getElementById(
            "periodDuration"
        ).value;


    // -------------------------------------------------
    // Check fields
    // -------------------------------------------------

    if (
        !lastPeriodValue ||
        !previousPeriodValue ||
        !durationValue
    ) {

        alert(
            "Please fill in all the details."
        );

        return;
    }


    // -------------------------------------------------
    // Create dates
    // -------------------------------------------------

    const lastPeriod =
        new Date(
            lastPeriodValue + "T00:00:00"
        );


    const previousPeriod =
        new Date(
            previousPeriodValue + "T00:00:00"
        );


    // -------------------------------------------------
    // Validate dates
    // -------------------------------------------------

    if (
        isNaN(lastPeriod.getTime()) ||
        isNaN(previousPeriod.getTime())
    ) {

        alert(
            "Please enter valid dates."
        );

        return;
    }


    // -------------------------------------------------
    // Check date order
    // -------------------------------------------------

    if (
        lastPeriod <= previousPeriod
    ) {

        alert(
            "Please make sure your most recent period date is later than the period before that."
        );

        return;
    }


    // -------------------------------------------------
    // Calculate cycle length
    // -------------------------------------------------

    const difference =
        Math.round(
            (
                lastPeriod -
                previousPeriod
            ) /
            (1000 * 60 * 60 * 24)
        );


    // -------------------------------------------------
    // Validate cycle length
    // -------------------------------------------------

    if (
        difference < 15 ||
        difference > 60
    ) {

        alert(
            "Please check your dates. The cycle length should be between 15 and 60 days for this project."
        );

        return;
    }


    // -------------------------------------------------
    // Calculate next expected period
    // -------------------------------------------------

    const nextPeriod =
        new Date(lastPeriod);

    nextPeriod.setDate(
        nextPeriod.getDate() +
        difference
    );


    // -------------------------------------------------
    // Store next period as YYYY-MM-DD
    // -------------------------------------------------
    // IMPORTANT:
    // Do not use toISOString() here because it can
    // shift the date by one day due to timezone.

    const nextPeriodValue =
        `${nextPeriod.getFullYear()}-${String(
            nextPeriod.getMonth() + 1
        ).padStart(2, "0")}-${String(
            nextPeriod.getDate()
        ).padStart(2, "0")}`;


    // -------------------------------------------------
    // Format dates for display
    // -------------------------------------------------

    const formattedLastPeriod =
        formatDate(
            lastPeriodValue
        );


    const formattedNextPeriod =
        formatDate(
            nextPeriodValue
        );


    // -------------------------------------------------
    // Display calculated result
    // -------------------------------------------------

    document.getElementById(
        "cycleLength"
    ).textContent =
        difference;


    document.getElementById(
        "nextPeriod"
    ).textContent =
        formattedNextPeriod;


    document.getElementById(
        "durationResult"
    ).textContent =
        durationValue;


    // -------------------------------------------------
    // Store current cycle temporarily
    // -------------------------------------------------

    currentCycleData = {

        lastPeriod:
            lastPeriodValue,

        previousPeriod:
            previousPeriodValue,

        periodDuration:
            Number(durationValue),

        cycleLength:
            difference,

        nextPeriod:
            nextPeriodValue

    };


    console.log(
        "Current cycle:",
        currentCycleData
    );


    // -------------------------------------------------
    // Show result section
    // -------------------------------------------------

    const resultSection =
        document.getElementById(
            "resultSection"
        );


    if (resultSection) {

        resultSection.style.display =
            "block";


        resultSection.scrollIntoView({
            behavior: "smooth"
        });
    }
}


// =====================================================
// SAVE CYCLE TO AWS / DYNAMODB
// =====================================================

async function saveCycle() {

    // -------------------------------------------------
    // Make sure calculation was done
    // -------------------------------------------------

    if (!currentCycleData) {

        alert(
            "Please calculate your cycle first."
        );

        return;
    }


    try {

        console.log(
            "Saving cycle to AWS..."
        );


        // -------------------------------------------------
        // Send POST request to Lambda
        // -------------------------------------------------

        const response =
            await fetch(
                API_URL,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            userId:
                                USER_ID,

                            lastPeriod:
                                currentCycleData.lastPeriod,

                            previousPeriod:
                                currentCycleData.previousPeriod,

                            periodDuration:
                                currentCycleData.periodDuration,

                            cycleLength:
                                currentCycleData.cycleLength,

                            nextPeriod:
                                currentCycleData.nextPeriod

                        })
                }
            );


        // -------------------------------------------------
        // Check response
        // -------------------------------------------------

        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );
        }


        // -------------------------------------------------
        // Read response
        // -------------------------------------------------

        const data =
            await response.json();


        console.log(
            "Saved successfully:",
            data
        );


        // -------------------------------------------------
        // Reload history from DynamoDB
        // -------------------------------------------------

        await displayHistory();


        // -------------------------------------------------
        // Success message
        // -------------------------------------------------

        alert(
            "Your cycle has been saved successfully ❤️"
        );


        // -------------------------------------------------
        // Clear current calculation
        // -------------------------------------------------

        currentCycleData = null;


    } catch (error) {

        console.error(
            "Error saving cycle:",
            error
        );


        alert(
            "Sorry, we could not save your cycle. Please check your AWS connection and try again."
        );
    }
}


// =====================================================
// DISPLAY HISTORY FROM AWS
// =====================================================

async function displayHistory() {

    const container =
        document.getElementById(
            "historyContainer"
        );


    // -------------------------------------------------
    // Check container
    // -------------------------------------------------

    if (!container) {

        console.error(
            "historyContainer was not found."
        );

        return;
    }


    // -------------------------------------------------
    // Show loading message
    // -------------------------------------------------

    container.innerHTML = `
        <p class="empty-history">
            Loading your saved cycles...
        </p>
    `;


    // -------------------------------------------------
    // Get history from AWS
    // -------------------------------------------------

    const history =
        await getHistory();


    // -------------------------------------------------
    // No history
    // -------------------------------------------------

    if (
        !history ||
        history.length === 0
    ) {

        container.innerHTML = `
            <p class="empty-history">
                Your saved cycles will appear here.
            </p>
        `;

        return;
    }


    // -------------------------------------------------
    // Remove exact duplicate records
    // -------------------------------------------------

    const uniqueHistory =
        history.filter(
            (record, index, array) => {

                const key =
                    [
                        record.lastPeriod,
                        record.previousPeriod,
                        record.periodDuration ||
                        record.duration,
                        record.cycleLength,
                        record.nextPeriod
                    ].join("|");


                return (
                    index ===
                    array.findIndex(
                        item => {

                            const itemKey =
                                [
                                    item.lastPeriod,
                                    item.previousPeriod,
                                    item.periodDuration ||
                                    item.duration,
                                    item.cycleLength,
                                    item.nextPeriod
                                ].join("|");


                            return (
                                itemKey === key
                            );
                        }
                    )
                );
            }
        );


    // -------------------------------------------------
    // Clear container
    // -------------------------------------------------

    container.innerHTML = "";


    // -------------------------------------------------
    // Display each record
    // -------------------------------------------------

    uniqueHistory.forEach(
        (record) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "history-card";


            // -----------------------------------------
            // Date values
            // -----------------------------------------

            const displayLastPeriod =
                formatDate(
                    record.lastPeriod
                );


            const displayNextPeriod =
                formatDate(
                    record.nextPeriod
                );


            // -----------------------------------------
            // Duration
            // -----------------------------------------

            const duration =
                record.periodDuration ||
                record.duration ||
                "";


            // -----------------------------------------
            // Create card content
            // -----------------------------------------

            card.innerHTML = `

                <div>

                    <div class="history-cycle">
                        ${record.cycleLength} day cycle
                    </div>

                    <div class="history-date">
                        Period started:
                        ${displayLastPeriod}
                    </div>

                    <div class="history-date">
                        Duration:
                        ${duration} days
                    </div>

                </div>

                <div class="history-next">
                    Next expected:
                    ${displayNextPeriod}
                </div>

            `;


            // -----------------------------------------
            // Add card to page
            // -----------------------------------------

            container.appendChild(
                card
            );

        }
    );
}


// =====================================================
// PAGE LOAD
// =====================================================

window.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "PeriodTrack frontend loaded."
        );


        // Load history from DynamoDB
        displayHistory();

    }
);