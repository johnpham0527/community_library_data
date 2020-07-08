/*** Global variables */
const censusAPI =                                       'https://api.census.gov/data';
const censusKey =                                       'key=ea46e190165e1ee608d643fba987f8b3620ec1a9';
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
    ],
    totalEnglishLanguagePop:                            'B16004_001',
    speakEnglishOnlyOrVeryWell: [
        { age5To17OnlyEnglish:                          'B16004_003E' },
        { age18To64OnlyEnglish:                         'B16004_025E' },
        { age65PlusOnlyEnglish:                         'B16004_047E' },
        { age5To17Spanish:                              'B16004_005E' },
        { age5To17IndoEuropean:                         'B16004_010E' },
        { age5To17AsianPacific:                         'B16004_015E' },
        { age5To17OtherLanguages:                       'B16004_020E' },
        { age18To64Spanish:                             'B16004_027E' },
        { age18To64IndoEuropean:                        'B16004_032E' },
        { age18To64AsianPacific:                        'B16004_037E' },
        { age18To64OtherLanguages:                      'B16004_042E' },
        { age65PlusSpanish:                             'B16004_049E' },
        { age65PlusIndoEuropean:                        'B16004_054E' },
        { age65PlusAsianPacific:                        'B16004_059E' },
        { age65PlusOtherLanguages:                      'B16004_064E' },
    ]
}

async function getCensusData(censusVar, area, censusDataset) { //fetch census data from API, given variable, area, and dataset
    return await $.getJSON(`${censusAPI}/${censusDataset}/acs/acs5?${censusKey}&get=${censusVar}&for=${area}`);
}

async function getCensusPoverty(libraryData, done) {
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

async function sumCensusVariables(censusVarArray, area, censusDataset) { //given an array of census variables, find the sum
    let promises = []; //we will populate this array with promises returned by getCensusData

    censusVarArray.forEach(censusVarHash => { //for each item in the numerator's array of variables to be summed up...
        const censusVar = censusVarHash[Object.keys(censusVarHash)[0]]; //retrieve Census API variable name from the hash
        promises.push(getCensusData(censusVar, area, censusDataset) //fetch the variable's data
            .then(data => parseInt(data[1][0])) //return the variable's value
        )
    });

    return await Promise.all(promises) //execute all of the getCensusData promises
        .then(async fetchedData => //given the fetched results of the getCensusData promises... 
            fetchedData.reduce((accumulator, currentValue) => accumulator + currentValue)) //...sum up and return their values
}

async function calculateCensusRate(numeratorArray, denominatorArray, area, censusDataset) {
    let numerator = await sumCensusVariables(numeratorArray, area, censusDataset);
    let denominator = await sumCensusVariables(denominatorArray, area, censusDataset);

    return (numerator/denominator*100).toFixed(1) //calculate and return the rate up to 1 decimal place
}

async function getUnemployment(libraryData, done) {
    const { censusDataset, zipCode } = libraryData;
    const area = `zip%20code%20tabulation%20area:${zipCode}`; //the zip code will be the area to filter
    const unemploymentRate = await calculateCensusRate(censusVars.unemployed, censusVars.laborForce, area, censusDataset) //calculate the unemployment rate, given the census variables for the number of unemployed and the total labor force participants

    done(null, { //execute the callback passing on the new libraryData state
        ...libraryData,
        unemploymentRate: unemploymentRate
    });
}

async function getLimitedEnglishProficiency(libraryData, done) {
    const { censusDataset, zipCode} = libraryData;
    const area = `zip%20code%20tabulation%20area:${zipCode}`; //the zip code will be the area to filter


    done(null, null);
}

async function getLessThanHighSchoolEducation(libraryData, done) {
    const data = '';

    done(null, data);
}

export { getCensusPoverty, getUnemployment, getLimitedEnglishProficiency, getLessThanHighSchoolEducation }

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