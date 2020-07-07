'use strict';

import { getLibraryZipCode, getNycDoePovertyRate } from './components/nycDoeApi.js';
import { getUnemployment, getPoverty, getLimitedEnglishProficiency, getLessThanHighSchoolEducation } from './components/censusApi.js'

function outputProfile(libraryData) { //output profile to #Profile, given the library data
    const { fullLibraryName, zipCode, nycDoeDataset, nycDoePovertyRate, schoolsInZipCode, censusDataset, unemploymentRate, censusPovertyRate } = libraryData;

    $('#Profile').html(`${fullLibraryName} is located in ZIP code ${zipCode}. According to the NYC Department of Education's ${nycDoeDataset} School Demographic Snapshot, ${nycDoePovertyRate}% of the students who attend the ${schoolsInZipCode} public school${schoolsInZipCode === 1 ? '' : 's'} located in this ZIP code receive free or reduced lunch or are eligible for NYC Human Resources Administration public benefits. According to the ${censusDataset} American Community Survey Five-Year Dataset, the ZIP code's unemployment rate is ${unemploymentRate}% and ${censusPovertyRate}% of residents live below the poverty line.`);

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