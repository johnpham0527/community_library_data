'use strict';

import { getLibraryZipCode, getNycDoePoverty } from './components/nycDoeApi.js';
import { getUnemployment, getCensusPoverty, getLimitedEnglishProficiency, getLessThanHighSchoolDiploma } from './components/censusApi.js'

function outputProfile(libraryData) { //output profile to #Profile, given the library data
    const { fullLibraryName, zipCode, nycDoeDataset, nycDoePovertyRate, schoolsInZipCode, censusDataset, unemploymentRate, censusPovertyRate, limitedEnglishPercent } = libraryData;

    $('#Profile').addClass("card");
    $('#Profile').html(`<div class="card-body">${fullLibraryName} is located in ZIP code ${zipCode}. According to the NYC Department of Education's ${nycDoeDataset} School Demographic Snapshot, ${nycDoePovertyRate}% of the students who attend the ${schoolsInZipCode} public school${schoolsInZipCode === 1 ? '' : 's'} located in this ZIP code receive free or reduced lunch or are eligible for NYC Human Resources Administration public benefits. According to the ${censusDataset} American Community Survey Five-Year Dataset, the ZIP code's unemployment rate is ${unemploymentRate}%; ${censusPovertyRate}% of residents live below the poverty line; and ${limitedEnglishPercent}% of residents speak English less than very well.</div>`);

    // let percentageNoHSDiploma = getAmericanCommunitySurvey5YearEstimateValue(ACSdataset,"S1501",zipCode); //S1501 is the American Community Survey table number for educational attainment

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
        $("#Profile").html(`<span class="spinner-border text-primary"></span> Retrieving data. Please wait... `);

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
                getNycDoePoverty(libraryData, function(err, libraryData) { //pass an anonymous function to output data after the poverty rate is calculated
                    if (err) console.log(`Error retrieving NYC DOE data: ${err}`);

                    getCensusPoverty(libraryData, function(err, libraryData) { //query the Census API to obtain poverty data
                        if (err) console.log(`Error retrieving Census poverty data: ${err}`);

                        getUnemployment(libraryData, function(err, libraryData) { //query the Census API to obtain unemployment data
                            if (err) console.log(`Error retrieving Census unemployment data: ${err}`);
                            
                            getLimitedEnglishProficiency(libraryData, function(err, libraryData) { //query the Census API to obtain English language proficiency data
                                if (err) console.log(`Error retrieving Census limited English language proficiency data: ${err}`);

                                getLessThanHighSchoolDiploma(libraryData, function(err, libraryData) {
                                    if (err) console.log(`Error retrieving Census educational attainment data: ${err}`);

                                    console.log(`Data is ${JSON.stringify(libraryData)}`);
                                    outputProfile(libraryData);
                                })
                            })
                        })
                    });
                })
            })
    });
});