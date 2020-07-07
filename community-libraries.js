/**** Global Variables */
const nycOpenData = 'https://data.cityofnewyork.us/resource';
const censusAPI = 'https://api.census.gov/data';
const nycOpenDataToken = '$$app_token=QoQet97KEDYpMW4x4Manaflkp'; //this is my (John Pham's) NYC Open Data app token
const censusKey = 'key=ea46e190165e1ee608d643fba987f8b3620ec1a9';
const censusVars = { //this is a map of various Census variables
    totalPovertyPop:                            'B17001_001E',
    numPoverty:                                 'B17001_002E',
    neverMarriedMaleInLaborForce:               'B12006_004E',
    neverMarriedMaleInLaborForceUnemployed:     'B12006_006E',
    neverMarriedFemaleInLaborForce:             'B12006_009E',
    neverMarriedFemaleInLaborForceUnemployed:   'B12006_011E',
    nowMarriedMaleInLaborForce:                 '',
    nowMarriedMaleInLaborForceUnemployed:       '',
    nowMarriedFemaleInLaborForce:               '',
    nowMarriedFemaleInLaborForceUnemployed:     '',
    separatedMaleInLaborForce:                  '',
    separatedMaleInLaborForceUnemployed:        '',
    separatedFemaleInLaborForce:                '',
    separatedFemaleInLaborForceUnemployed:      '',
    widowedMaleInLaborForce:                    '',
    widowedMaleInLaborForceUnemployed:          '',
    widowedFemaleLaborForce:                    '',
    widowedFemaleLaborForceUnemployed:          '',
    divorcedMaleInLaborForce:                   '',
    divorcedMaleInLaborForceUnemployed:         '',
    divorcedFemaleInLaborForce:                 '',
    divorcedFemaleInLaborForceUnemployed:       '',


    /* Unemployment is available as Marital Status by Sex by Labor Force Participation
    Link: https://data.census.gov/cedsci/table?q=B12006%3A%20MARITAL%20STATUS%20BY%20SEX%20BY%20LABOR%20FORCE%20PARTICIPATION&hidePreview=false&tid=ACSDT1Y2018.B12006&t=Marital%20Status%20and%20Marital%20History%3AAge%20and%20Sex&vintage=2018
    Link: https://api.census.gov/data/2018/acs/acs5/variables.html
    Marital Statuses: never married, now married (except separated), separated, widows, divorced
    Sex Statuses: male, female
    Labor Force Statuses: in labor force, not in labor force
    In Labor Force Statuses: employed or in armed forces, unemployed
    I need these 20 variables:
    * never married males in labor force, total - DONE
    * never married males in labor force, unemployed - DONE
    * never married females in labor force, total - DONE
    * never married females in labor force, unemployed - DONE
    * now married males in labor force, total
    * now married males in labor force, unemployed
    * now married females in labor force, total
    * now married females in labor force, unemployed
    * separated males in labor force, total
    * separated males in labor force, unemployed
    * separated females in labor force, total
    * separated females in labor force, unemployed
    * widowed males in labor force, total
    * widowed males in labor force, unemployed
    * widowed females in labor force, total
    * widowed females in labor force, unemployed
    * divorced males in labor force, total
    * divorced males in labor force, unemployed
    * divorced females in labor force, total
    * divorced females in labor force, unemployed

    Filter by ZCTA5
    */
}

async function getLibraryZipCode(libraryData) { //given a library's name, return the ZIP code
    let data = await $.getJSON(`${nycOpenData}/b67a-vkqb.json?name=${libraryData.shortLibraryName}&${nycOpenDataToken}&$limit=1`);
    return data[0]["postcode"];
};

async function getNycDoeSchoolsDataByZipCode(zipCode) { //return data on the public schools located in a given ZIP code
    return await $.getJSON(`${nycOpenData}/r2nx-nhxe.json?location_1_zip=${zipCode}&${nycOpenDataToken}&$limit=5000`);
}

async function getSchoolDataByDbn(dbn, year) { //return data on a school, given the DBN and dataset year
    return await $.getJSON(`${nycOpenData}/45j8-f6um.json?dbn=${dbn}&year=${year}&${nycOpenDataToken}&$limit=1`);
}

async function getNycDoePovertyRate(libraryData, done) {
    const { zipCode, nycDoeDataset } = libraryData; //destructure libraryData to obtain the ZIP code and dataset year
    let povertyCountSum = 0;
    let enrollmentSum = 0;
    let promises = []; //we will populate this promises array with promises returned by getSchoolDataByDbn
    let newLibraryData = Object.assign({}, libraryData); //newLibraryData will be the return object

    let schools = await getNycDoeSchoolsDataByZipCode(zipCode); //retrieve an array of schools filtered by the given ZIP code
    newLibraryData.schoolsInZipCode = schools.length; //store the number of schools in the global variable

    for (let i = 0; i < schools.length; i++) { //run a for-loop through the schools array. For each school in the school array:
        let schoolDBN = schools[i]['ats_system_code']; //find the schoolDBN for each school
        let modifiedSchoolDBN = $.trim(schoolDBN); //remove white space from school DBN
        let selectDatasetYear = nycDoeDataset.slice(0,5) + nycDoeDataset.slice(7); //slice the dataset year; format is '2018-19'
        promises.push(getSchoolDataByDbn(modifiedSchoolDBN, selectDatasetYear) //fetch that school's record from the NYC DOE Demographic Snapshot dataset
            .then(schoolData => { //sum up the povertyCount and enrollment for each school
                povertyCountSum += parseInt(schoolData[0]["poverty"]); //obtain the number of students in the school who meet the DOE's poverty criteria. Add this number to a poverty count sum variable.
                enrollmentSum += parseInt(schoolData[0]["total_enrollment"]); //obtain the school's total enrollment and add it to an enrollment sum variable
            })
        )
    }

    Promise.all(promises) //execute all of the promises in the array
        .then(() => {
            newLibraryData.nycDoePovertyRate = (povertyCountSum/enrollmentSum*100).toFixed(1);
            done(null, newLibraryData) //calculate the poverty percentage to one decimal place and pass it into the callback
        })
};

async function getCensusFiveYearPoverty(libraryData, done) {
    const { censusDataset, zipCode } = libraryData; //destructure libraryData
    const area = `zip%20code%20tabulation%20area:${zipCode}`; //the zip code will be the area to filter
    const totalPovertyPopLink = `${censusAPI}/${censusDataset}/acs/acs5?${censusKey}&get=${censusVars.totalPovertyPop}&for=${area}`;
    const numPovertyLink = `${censusAPI}/${censusDataset}/acs/acs5?${censusKey}&get=${censusVars.numPoverty}&for=${area}`;

    const data1 = await $.getJSON(totalPovertyPopLink);
    let totalPop = data1[1][0];

    const data2 = await $.getJSON(numPovertyLink);
    let numPoverty = data2[1][0];

    done(null, { //execute the callback, passing along null for error and updated data
        ...libraryData, //use the spread operator and avoid mutating libraryData
        censusPovertyPercentage: (numPoverty/totalPop*100).toFixed(1) //calculate and assign censusPovertyPercentage property
    }); 
}

async function getCensusFiveYearUnemployment(libraryData, done) {
    const { censusDataset, zipCode } = libraryData;
    const area = `zip%20code%20tabulation%20area:${zipCode}`; //the zip code will be the area to filter

    const totalUnemployedPopLink = ``;
    const numUnemployedLink = ``;

    const data1 = await $.getJSON(totalUnemployedPopLink);
    let totalPop = data1[1][0];

    const data2 = await $.getJSON(numUnemployedLink);
    let numUnemployed = data2[1][0];

    done(null, {
        ...libraryData, 
        unemploymentPercentage: (numUnemployed/totalPop*100).toFixed(1)
    }) 
}

function outputProfile(libraryData) { //output profile to #Profile, given the library data
    const { fullLibraryName, zipCode, nycDoeDataset, nycDoePovertyRate, schoolsInZipCode } = libraryData;

    $('#Profile').html(`${fullLibraryName} is located in ZIP code ${zipCode}. According to the NYC Department of Education's ${nycDoeDataset} School Demographic Snapshot, ${nycDoePovertyRate}% of the students who attend the ${schoolsInZipCode} public school${schoolsInZipCode === 1 ? '' : 's'} located in this ZIP code receive free or reduced lunch or are eligible for NYC Human Resources Administration public benefits.`);
}

$(document).ready(function(){
    $("input[id='ViewCommunityProfile']").click(function() {
        $("#Profile").html("Please wait...");

        let shortLibraryName = $("select.communityLibrary").val(); //NYC Open Data references each library's short name;

        let libraryData = { //this data structure will store all of the values that each callback finds
            schoolsInZipCode: 0, //variable for counting number of schools in a ZIP code
            nycDoeDataset: $("input[name='NYCDOEDataset']:checked").val(),
            censusDataset: $("input[name='ACSDataset']:checked").val(),
            shortLibraryName: shortLibraryName,
            fullLibraryName: shortLibraryName === 'Central Library' ? //generate each library's full name using a ternary operator
                shortLibraryName : shortLibraryName + ' Community Library' //generate the library's full name if it is not the Central Library
        };

        getLibraryZipCode(libraryData) //query the NYC DOE data to obtain the ZIP code.
            .then(zipCode => {
                libraryData.zipCode = zipCode;
                getNycDoePovertyRate(libraryData, function(err, newLibraryData) { //pass an anonymous function to output data after the poverty rate is calculated
                    if (err) console.log(`Error retrieving NYC DOE data: ${err}`);

                    outputProfile(newLibraryData);

                    getCensusFiveYearPoverty(newLibraryData, function(err, newLibraryData2) {
                        if (err) console.log(`Error retrieving Census poverty data: ${err}`)
                        console.log(`Data is ${JSON.stringify(newLibraryData2)}`);
                    });
                })
            })
    });
});



// function updatePage(zipCode, nycDoeDataset, fullLibraryName, nycDoePovertyRate) {
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
// }

// function getAmericanCommunitySurvey5YearEstimateValue(datasetYear, tableNumber, zipCode) {
//     let selectDatasetYear = "17"; //this is the default dataset year to use
//     let returnValue = 0;

//     switch(datasetYear) {
//         case "2017 Five-Year Estimates":
//             selectDatasetYear = "17";
//             break;
//         case "2016 Five-Year Estimates":
//             selectDatasetYear = "16";
//     break;
//     }
    
//     let buildURL1 = "http://factfinder.census.gov/service/data/v1/en/programs/ACS/datasets/" + selectDatasetYear + "_5YR/tables/";
//     let buildURL2 = "/data/8600000US" + zipCode + "?maxResults=1&key=" + "ea46e190165e1ee608d643fba987f8b3620ec1a9";
//     let buildURLFinal = buildURL1 + tableNumber.toString() + buildURL2;
    
//     $.ajax({
//         url: buildURLFinal,
//         async: false,
//         type: "GET",
//         success: function(data) {
            
//             switch(tableNumber) {
//             case "S2301": //American Community Survey dataset for unemployment rate
//                 returnValue = data.data.rows[0].cells.C7.value;
//                 break;
//             case "S1501": //American Community Survey dataset for educational attainment
//                 var value1 = data.data.rows[0].cells.C75.value; //the percentage of people age 25+ who have less than a 9th grade education
//                 var value2 = data.data.rows[0].cells.C87.value; //the percentage of people age 25+ who have a 9th-12th grade education but lack a high school diploma or its equivalent
//                 var value3 = parseFloat(value1) + parseFloat(value2); //add the two values together
//                 returnValue = value3.toFixed(1);
//                 break;
//             case "S1701": //American Community Survey dataset for poverty
//                 returnValue = data.data.rows[0].cells.C5.value; //percentage of population for whom poverty status is determined who earned an income at the poverty level or lower
//                 break;
//             case "DP02": //American Community Survey dataset called "Selected Social Characteristics in the United States"
//                 returnValue = data.data.rows[0].cells.C411.value; //percentage of people age 5 and older who speak English less than "very well," among those people who speak a language other than English
//                 break;
//             }//closes the switch statement
//             } //closes success
//             })//closes the AJAX call's property list
//     return returnValue;
// }; //closes the function