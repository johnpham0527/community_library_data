let schoolsInZIPCode = 0; //global variable for counting number of schools in a ZIP code
const nycOpenData = 'https://data.cityofnewyork.us/resource';
const appToken = '$$app_token=QoQet97KEDYpMW4x4Manaflkp'; //This is my (John Pham's) NYC Open Data app token

async function getLibraryZipCode(libraryName) { //given a library's name, return the ZIP code
    let data = await $.getJSON(`${nycOpenData}/b67a-vkqb.json?name=${libraryName}&${appToken}&$limit=1`);
    return data[0]["postcode"];
};

async function getNycDoeSchoolsDataByZipCode(zipCode) { //return data on the public schools located in a given ZIP code
    return await $.getJSON(`${nycOpenData}/r2nx-nhxe.json?location_1_zip=${zipCode}&${appToken}&$limit=5000`);
}

async function getSchoolDataByDbn(dbn, year) {
    return await $.getJSON(`${nycOpenData}/45j8-f6um.json?dbn=${dbn}&year=${year}&${appToken}&$limit=1`); //return data about a school, given its DBN and dataset year
}

async function getNYCDOEPovertyRateByZIPCode(zipCode, datasetYear, callback) {
    let povertyCountSum = 0;
    let enrollmentSum = 0;
    let promises = []; //we will populate this promises array with promises returned by getSchoolDataByDbn

    let schools = await getNycDoeSchoolsDataByZipCode(zipCode); //retrieve an array of schools filtered by the given ZIP code
    schoolsInZIPCode = schools.length; //store the number of schools in the global variable

    for (let i = 0; i < schools.length; i++) { //run a for-loop through the schools array. For each school in the school array:
        let schoolDBN = schools[i]['ats_system_code']; //find the schoolDBN for each school
        let modifiedSchoolDBN = $.trim(schoolDBN); //remove white space from school DBN
        let selectDatasetYear = datasetYear.slice(0,5) + datasetYear.slice(7); //slice the dataset year; format is '2018-19'
        promises.push(getSchoolDataByDbn(modifiedSchoolDBN, selectDatasetYear) //fetch that school's record from the NYC DOE Demographic Snapshot dataset
            .then(schoolData => { //sum up the povertyCount and enrollment for each school
                povertyCountSum += parseInt(schoolData[0]["poverty"]); //obtain the number of students in the school who meet the DOE's poverty criteria. Add this number to a poverty count sum variable.
                enrollmentSum += parseInt(schoolData[0]["total_enrollment"]); //obtain the school's total enrollment and add it to an enrollment sum variable
            })
        )
    }

    Promise.all(promises) //execute all of the promises in the array
        .then(() => 
            callback((povertyCountSum/enrollmentSum*100).toFixed(1)) //calculate the poverty percentage to one decimal place and pass it into the callback
        )
};

async function getCensusFiveYearPovertyByZipCode(year, zipCode) {
    const key = `key=ea46e190165e1ee608d643fba987f8b3620ec1a9`;
    const totalPopLink = `https://api.census.gov/data/${year}/acs/acs5?${key}&get=B17001_001E&for=zip%20code%20tabulation%20area:${zipCode}`;
    const povertyLink = `https://api.census.gov/data/${year}/acs/acs5?${key}&get=B17001_002E&for=zip%20code%20tabulation%20area:${zipCode}`;
    let totalPop = 0;
    let povertyNum = 0;

    fetch(totalPopLink)
        .then(response => response.json())
        .then(data => {
            totalPop = data[1][0];
            console.log(`totalPop is ${totalPop}`)
            
            fetch(povertyLink)
            .then(response => response.json())
            .then(data => {
                povertyNum = data[1][0];
                console.log(`povertyNum is ${povertyNum}`)
                console.log(`The poverty percentage is ${(povertyNum/totalPop*100).toFixed(1)}`);
            })
        })
}

$(document).ready(function(){
    $("input[id='ViewCommunityProfile']").click(function() {
        $("#Profile").html("Please wait...");

        let nycDoeDataset = $("input[name='NYCDOEDataset']:checked").val();
        let acsDataset = $("input[name='ACSDataset']:checked").val();
        let shortLibraryName = $("select.communityLibrary").val();
        let fullLibraryName = shortLibraryName;
        if (shortLibraryName != "Central Library") {
            fullLibraryName = shortLibraryName + " Community Library"; //generate the library's full name if it is not the Central Library
        }

        getLibraryZipCode(shortLibraryName) //query the NYC DOE data to obtain the ZIP code.
            .then(zipCode => {
                getNYCDOEPovertyRateByZIPCode(zipCode, nycDoeDataset, function(nycDoePovertyRate) { //pass an anonymous function to output data after the poverty rate is calculated
                    $('#Profile').html(`${fullLibraryName} is located in ZIP code ${zipCode}. According to the NYC Department of Education's ${nycDoeDataset} School Demographic Snapshot, ${nycDoePovertyRate}% of the students who attend the ${schoolsInZIPCode} public school${schoolsInZIPCode === 1 ? '' : 's'} located in this ZIP code receive free or reduced lunch or are eligible for NYC Human Resources Administration public benefits.`);

                    getCensusFiveYearPovertyByZipCode(acsDataset, zipCode);
                })
            })
    });
});



function updatePage(zipCode, nycDoeDataset, fullLibraryName, nycDoePovertyRate) {
    // let unemploymentRate = getAmericanCommunitySurvey5YearEstimateValue(ACSdataset,"S2301",zipCode);
    // let percentageNoHSDiploma = getAmericanCommunitySurvey5YearEstimateValue(ACSdataset,"S1501",zipCode); //S1501 is the American Community Survey table number for educational attainment
    // let ACSPovertyRate = getAmericanCommunitySurvey5YearEstimateValue(ACSdataset, "S1701", zipCode); //S1701 is the American Community Survey table number for poverty
    // let limitedEnglishProfiencyRate = getAmericanCommunitySurvey5YearEstimateValue(ACSdataset, "DP02", zipCode); //DP02 is the American Community Survey for U.S. general social characteristics

    // $("#ACS1").append(" According to the American Community Survey ");
    // $("#ACSdataset").append(ACSdataset);
    // $("#ACS2").append(", the ZIP code's unemployment rate is ");
    // $("#Unemployment").append(unemploymentRate);
    // $("#ACS3").append("%; ");
    // $("#NoHS").append(percentageNoHSDiploma);
    // $("#ACS4").append("% of residents do not possess a high school diploma or its equivalent; ");
    // $("#ACSPoverty").append(ACSPovertyRate);
    // $("#ACS5").append("% of residents live below the poverty line; and ");
    // $("#LimitedEnglish").append(limitedEnglishProfiencyRate);
    // $("#ACS6").append("% of residents speak English less than very well."); 
}

function getAmericanCommunitySurvey5YearEstimateValue(datasetYear, tableNumber, zipCode) {
    let selectDatasetYear = "17"; //this is the default dataset year to use
    let returnValue = 0;

    switch(datasetYear) {
        case "2017 Five-Year Estimates":
            selectDatasetYear = "17";
            break;
        case "2016 Five-Year Estimates":
            selectDatasetYear = "16";
    break;
    }
    
    let buildURL1 = "http://factfinder.census.gov/service/data/v1/en/programs/ACS/datasets/" + selectDatasetYear + "_5YR/tables/";
    let buildURL2 = "/data/8600000US" + zipCode + "?maxResults=1&key=" + "ea46e190165e1ee608d643fba987f8b3620ec1a9";
    let buildURLFinal = buildURL1 + tableNumber.toString() + buildURL2;
    
    $.ajax({
        url: buildURLFinal,
        async: false,
        type: "GET",
        success: function(data) {
            
            switch(tableNumber) {
            case "S2301": //American Community Survey dataset for unemployment rate
                returnValue = data.data.rows[0].cells.C7.value;
                break;
            case "S1501": //American Community Survey dataset for educational attainment
                var value1 = data.data.rows[0].cells.C75.value; //the percentage of people age 25+ who have less than a 9th grade education
                var value2 = data.data.rows[0].cells.C87.value; //the percentage of people age 25+ who have a 9th-12th grade education but lack a high school diploma or its equivalent
                var value3 = parseFloat(value1) + parseFloat(value2); //add the two values together
                returnValue = value3.toFixed(1);
                break;
            case "S1701": //American Community Survey dataset for poverty
                returnValue = data.data.rows[0].cells.C5.value; //percentage of population for whom poverty status is determined who earned an income at the poverty level or lower
                break;
            case "DP02": //American Community Survey dataset called "Selected Social Characteristics in the United States"
                returnValue = data.data.rows[0].cells.C411.value; //percentage of people age 5 and older who speak English less than "very well," among those people who speak a language other than English
                break;
            }//closes the switch statement
            } //closes success
            })//closes the AJAX call's property list
    return returnValue;
}; //closes the function