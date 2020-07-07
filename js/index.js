'use strict';

import { getLibraryZipCode, getNycDoePovertyRate } from './components/nycDoeApi.js';

/**** Global Variables */
const censusAPI =           'https://api.census.gov/data';
const censusKey =           'key=ea46e190165e1ee608d643fba987f8b3620ec1a9';
const censusVars = { //this is a map of various Census variables
    totalPovertyPop:                                    'B17001_001E',
    numPoverty:                                         'B17001_002E',
    laborForce:     [
        { neverMarriedMaleInLaborForce:                 'B12006_004E' },
        { neverMarriedFemaleInLaborForce:               'B12006_009E' },
        { nowMarriedMaleInLaborForce:                   'B12006_015E' },
        { nowMarriedFemaleInLaborForce:                 'B12006_020E' },
        { separatedMaleInLaborForce:                    'B12006_026E' },
        { separatedFemaleInLaborForce:                  'B12006_031E' },
        { widowedMaleInLaborForce:                      'B12006_037E' },
        { widowedFemaleLaborForce:                      'B12006_042E' },
        { divorcedMaleInLaborForce:                     'B12006_048E' },
        { divorcedFemaleInLaborForce:                   'B12006_053E' },
    ],
    unemployed:   [
        { neverMarriedMaleInLaborForceUnemployed:       'B12006_006E' },
        { neverMarriedFemaleInLaborForceUnemployed:     'B12006_011E' },
        { nowMarriedMaleInLaborForceUnemployed:         'B12006_017E' },
        { nowMarriedFemaleInLaborForceUnemployed:       'B12006_022E' },
        { separatedMaleInLaborForceUnemployed:          'B12006_028E' },
        { separatedFemaleInLaborForceUnemployed:        'B12006_033E' },
        { widowedMaleInLaborForceUnemployed:            'B12006_039E' },
        { widowedFemaleLaborForceUnemployed:            'B12006_044E' },
        { divorcedMaleInLaborForceUnemployed:           'B12006_050E' },
        { divorcedFemaleInLaborForceUnemployed:         'B12006_055E' },
    ]
}

async function getCensusData(censusVar, area, censusDataset) { //fetch census data from API, given variable, area, and dataset
    //console.log(`censusVar is ${censusVar}, censusDataset is ${censusDataset}, and area is ${area}`);
    let data = await $.getJSON(`${censusAPI}/${censusDataset}/acs/acs5?${censusKey}&get=${censusVar}&for=${area}`);
    //console.log(`censusVar is ${censusVar} and data is ${data}`);
    return data;
}

async function getCensusFiveYearPoverty(libraryData, done) {
    const { censusDataset, zipCode } = libraryData; //destructure libraryData
    const area = `zip%20code%20tabulation%20area:${zipCode}`; //the zip code will be the area to filter

    const data1 = await getCensusData(censusVars.totalPovertyPop, area, censusDataset);
    let totalPop = data1[1][0]; //get total population for poverty measure

    const data2 = await getCensusData(censusVars.numPoverty, area, censusDataset);
    let numPoverty = data2[1][0]; //get number of individuals in poverty for past 12 months

    done(null, { //execute the callback, passing along null for error and updated data
        ...libraryData, //use the spread operator and avoid mutating libraryData
        censusPovertyRate: (numPoverty/totalPop*100).toFixed(1) //calculate and assign censusPovertyRate property
    }); 
}

async function getCensusFiveYearUnemployment(libraryData, done) {
    const { censusDataset, zipCode } = libraryData;
    const area = `zip%20code%20tabulation%20area:${zipCode}`; //the zip code will be the area to filter
    let laborForcePop = 0;
    let numUnemployed = 0;
    let laborForcePromises = []; //we will populate this promises array with promises returned by getCensusData
    let unemployedPromises = []; //we will populate this promises array with promises returned by getCensusData

    censusVars.laborForce.forEach(censusVarObject => { //censusVars.laborForce is an array of total labor force count-related census variables
        const censusVar = censusVarObject[Object.keys(censusVarObject)[0]];
        laborForcePromises.push(getCensusData(censusVar, area, censusDataset) //fetch that unemployment census variable's data
            .then(laborForceData => {
                laborForcePop += parseInt(laborForceData[1][0]); //sum up the labor force total population for each variable type
            })
        )
    })

    censusVars.unemployed.forEach(censusVarObject => { //censusVars.laborForce is an array of unemployment count-related census variables
        const censusVar2 = censusVarObject[Object.keys(censusVarObject)[0]];
        unemployedPromises.push(getCensusData(censusVar2, area, censusDataset) //fetch that unemployment census variable's data
            .then(unemployedData => {
                numUnemployed += parseInt(unemployedData[1][0]); //sum up the unemployed count for each variable type
            })
        )
    })

    Promise.all(laborForcePromises)
        .then(() => {
            Promise.all(unemployedPromises)
            .then(() => {
                done(null, {
                    ...libraryData, 
                    unemploymentRate: (numUnemployed/laborForcePop*100).toFixed(1)
                }) 
            })
        })
}

function outputProfile(libraryData) { //output profile to #Profile, given the library data
    const { fullLibraryName, zipCode, nycDoeDataset, nycDoePovertyRate, schoolsInZipCode, censusDataset, unemploymentRate, censusPovertyRate } = libraryData;

    $('#Profile').html(`${fullLibraryName} is located in ZIP code ${zipCode}. According to the NYC Department of Education's ${nycDoeDataset} School Demographic Snapshot, ${nycDoePovertyRate}% of the students who attend the ${schoolsInZipCode} public school${schoolsInZipCode === 1 ? '' : 's'} located in this ZIP code receive free or reduced lunch or are eligible for NYC Human Resources Administration public benefits. According to the ${censusDataset} American Community Survey Five-Year Dataset, the ZIP code's unemployment rate is ${unemploymentRate}% and ${censusPovertyRate}% of residents live below the poverty line.`);
}

$(document).ready(function(){
    $("input[id='ViewCommunityProfile']").click(function() {
        $("#Profile").html("Retrieving data. Please wait... ");

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

                    getCensusFiveYearPoverty(newLibraryData, function(err, newLibraryData2) { //query the Census Bureau to obtain poverty data
                        if (err) console.log(`Error retrieving Census poverty data: ${err}`)

                        getCensusFiveYearUnemployment(newLibraryData2, function(err, newLibraryData3) { //query the Census Bureau to obtain unemployment data
                            if (err) console.log(`Error retrieving Census unemployment data: ${err}`)
                            console.log(`Data is ${JSON.stringify(newLibraryData3)}`);
                            
                            outputProfile(newLibraryData3);
                        })
                    });
                })
            })
    });
});



// function updatePage(zipCode, nycDoeDataset, fullLibraryName, nycDoePovertyRate) {
    // let percentageNoHSDiploma = getAmericanCommunitySurvey5YearEstimateValue(ACSdataset,"S1501",zipCode); //S1501 is the American Community Survey table number for educational attainment
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