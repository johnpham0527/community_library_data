'use strict';

import { getLibraryZipCode, getNycDoePoverty } from './components/nycDoeApi.js';
import { getUnemployment, getCensusPoverty, getLimitedEnglishProficiency, getLessThanHighSchoolDiploma } from './components/censusApi.js'

function outputProfile(libraryData) { // output profile to #Profile, given the library data
    const { fullLibraryName, zipCode, nycDoeDataset, nycDoePovertyRate, schoolsInZipCode, censusDataset, unemploymentRate, censusPovertyRate, limitedEnglishPercent, noHighSchoolDiplomaOrEquivalent } = libraryData; // destructure these variables to make it easier to reference

    $('#Profile').addClass("card");
    $('#Profile').html(`<div class="card-body">${fullLibraryName} is located in ZIP code ${zipCode}. According to the NYC Department of Education's ${nycDoeDataset} School Demographic Snapshot, ${nycDoePovertyRate}% of the students who attend the ${schoolsInZipCode} public school${schoolsInZipCode === 1 ? '' : 's'} located in this ZIP code receive free or reduced lunch or are eligible for NYC Human Resources Administration public benefits. According to the ${censusDataset} American Community Survey Five-Year Dataset, the ZIP code's unemployment rate is ${unemploymentRate}%; ${noHighSchoolDiplomaOrEquivalent}% of adults age 25 or older do not possess a high school diploma or its equivalent; ${censusPovertyRate}% of residents live below the poverty line; and ${limitedEnglishPercent}% of residents speak English less than very well.</div>`);
}

$(document).ready(function(){
    $("input[id='ViewCommunityProfile']").click(function() { // this is the click handler for the ViewCommunityProfile button
        $("#Profile").html(`<span class="spinner-border text-primary"></span> Retrieving data. Please wait... `); // let the user know that we are retrieving the data

        let shortLibraryName = $("select.communityLibrary").val(); // NYC Open Data references each library's short name;


        let libraryData = { // this data structure will store all of the values that each callback finds
            schoolsInZipCode: 0, // variable for counting number of schools in a ZIP code
            nycDoeDataset: $("input[name='NYCDOEDataset']:checked").val(),
            censusDataset: $("input[name='ACSDataset']:checked").val(),
            shortLibraryName: shortLibraryName,
            fullLibraryName: shortLibraryName === 'Central Library' ? // generate each library's full name using a ternary operator
                shortLibraryName : shortLibraryName + ' Community Library' // generate the library's full name if it is not the Central Library
        };

        getLibraryZipCode(libraryData) // query the NYC DOE data to obtain the ZIP code.
            .then(async zipCode => {
                libraryData.zipCode = zipCode;

                libraryData = await getNycDoePoverty(libraryData) //assign this promise chain to libraryData object
                                .then(libraryData => getCensusPoverty(libraryData))
                                .then(libraryData => getUnemployment(libraryData))
                                .then(libraryData => getLimitedEnglishProficiency(libraryData))
                console.log(`libraryData is ${JSON.stringify(libraryData)}`);

                            

                //                 getLessThanHighSchoolDiploma(libraryData, function(err, libraryData) { // query the Census API to obtain high school educational attainment data
                //                     if (err) console.error(`Error retrieving Census educational attainment data: Status: ${err.status}. Error: ${err.statusText}`);

                //                     outputProfile(libraryData);
                //                 })
            })
    });
});