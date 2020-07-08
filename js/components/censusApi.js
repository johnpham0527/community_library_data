/*** Global variables */
const censusAPI =                                       'https://api.census.gov/data';
const censusKey =                                       'key=ea46e190165e1ee608d643fba987f8b3620ec1a9';
const censusVars = { // this is a map of various Census variables

    /* poverty variables */
    totalPovertyPop:                                    'B17001_001E',
    numPoverty:                                         'B17001_002E',

    /* unemployment variables */
    laborForce:     [ // the variables in this array need to be summed up
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
    unemployed:   [ // the variables in this array need to be summed up
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

    /* English language proficiency variables */
    totalEnglishLanguagePop:                            'B16004_001E',
    speakEnglishOnlyOrVeryWell: [ // the variables in this array need to be summed up
        { age5To17OnlyEnglish:                          'B16004_003E' },
        { age5To17Spanish:                              'B16004_005E' },
        { age5To17IndoEuropean:                         'B16004_010E' },
        { age5To17AsianPacific:                         'B16004_015E' },
        { age5To17OtherLanguages:                       'B16004_020E' },
        { age18To64OnlyEnglish:                         'B16004_025E' },
        { age18To64Spanish:                             'B16004_027E' },
        { age18To64IndoEuropean:                        'B16004_032E' },
        { age18To64AsianPacific:                        'B16004_037E' },
        { age18To64OtherLanguages:                      'B16004_042E' },
        { age65PlusOnlyEnglish:                         'B16004_047E' },
        { age65PlusSpanish:                             'B16004_049E' },
        { age65PlusIndoEuropean:                        'B16004_054E' },
        { age65PlusAsianPacific:                        'B16004_059E' },
        { age65PlusOtherLanguages:                      'B16004_064E' },
    ],

    /* High school diploma attainment variables */
    totalPop25Plus:                                     'DP02_0058E',
    age25PlusLessThan9thGrade:                          'DP02_0059E',
    age25Plus9thTo12thGradeNoDiploma:                   'DP02_0060E'
}

async function getCensusData(censusVar, area, censusDataset, additional='') { // fetch census data from API, given variable, area, and dataset
    let data = await $.getJSON(`${censusAPI}/${censusDataset}/acs/acs5${additional}?${censusKey}&get=${censusVar}&for=${area}`); // fetch the census variable data from the API
    return parseInt(data[1][0]); // return the Census estimate, ignoring other information such as the margin of error
}

async function getCensusPoverty(libraryData, done) {
    const { censusDataset, zipCode } = libraryData; // destructure libraryData
    const area = `zip%20code%20tabulation%20area:${zipCode}`; // the ZIP code will be the area to filter

    const totalPop = await getCensusData(censusVars.totalPovertyPop, area, censusDataset); // get total population for poverty measure
    const numPoverty = await getCensusData(censusVars.numPoverty, area, censusDataset); // get number of individuals in poverty for past 12 months

    done(null, { // execute the callback, passing along null for error and updated data
        ...libraryData, // use the spread operator and avoid mutating libraryData
        censusPovertyRate: (numPoverty/totalPop*100).toFixed(1) // calculate and assign censusPovertyRate property
    }); 
}

async function sumCensusVariables(censusVarArray, area, censusDataset) { // given an array of census variables, find the sum
    let promises = []; // we will populate this array with promises returned by getCensusData

    censusVarArray.forEach(censusVarHash => { // for each item in the numerator's array of variables to be summed up...
        const censusVar = censusVarHash[Object.keys(censusVarHash)[0]]; // retrieve Census API variable name from the hash
        promises.push(getCensusData(censusVar, area, censusDataset) // fetch the variable's data
            .then(data => parseInt(data)) // return the variable's value as an integer
        )
    });

    return await Promise.all(promises) // execute all of the getCensusData promises
        .then(async fetchedData => // given the fetched results of the getCensusData promises... 
            fetchedData.reduce((accumulator, currentValue) => accumulator + currentValue)) // ...sum up and return their values
}

async function calculateCensusRate(numeratorArray, denominatorArray, area, censusDataset) { // given two arrays, sum up each array to find the numerator and denominator. Then, return the value as a whole percentage, up to one decimal place
    let numerator = await sumCensusVariables(numeratorArray, area, censusDataset); // sum up the variables in the array
    let denominator = await sumCensusVariables(denominatorArray, area, censusDataset); // sum up the variables in the array

    return (numerator/denominator*100).toFixed(1) // calculate and return the rate up to 1 decimal place
}

async function getUnemployment(libraryData, done) {
    const { censusDataset, zipCode } = libraryData;
    const area = `zip%20code%20tabulation%20area:${zipCode}`; // the ZIP code will be the area to filter
    const unemploymentRate = await calculateCensusRate(censusVars.unemployed, censusVars.laborForce, area, censusDataset) // calculate the unemployment rate, given the census variables for the number of unemployed and the total labor force participants

    done(null, { // execute the callback passing on the new libraryData state
        ...libraryData,
        unemploymentRate: unemploymentRate // assign the unemployment rate as a new property of libraryData
    });
}

async function getLimitedEnglishProficiency(libraryData, done) {
    const { censusDataset, zipCode} = libraryData;
    const area = `zip%20code%20tabulation%20area:${zipCode}`; // the ZIP code will be the area to filter

    const totalPop = await getCensusData(censusVars.totalEnglishLanguagePop, area, censusDataset); // fetch the data for the population of English speakers

    const numEnglishProficient = await sumCensusVariables(censusVars.speakEnglishOnlyOrVeryWell, area, censusDataset); // fetch the number of people who speak only English or speak English very well
    const numEnglishLessThanVeryWell = totalPop - numEnglishProficient; // calculate the number of people who speak English less than very well

    done(null, {
        ...libraryData,
        limitedEnglishPercent: (numEnglishLessThanVeryWell/totalPop*100).toFixed(1) // calculate and assign the percentage of people who speak English less than very well, up to one decimal place
    });
}

async function getLessThanHighSchoolDiploma(libraryData, done) {
    const { censusDataset, zipCode} = libraryData;
    const area = `zip%20code%20tabulation%20area:${zipCode}`; // the ZIP code will be the area to filter

    const totalPop = await getCensusData(censusVars.totalPop25Plus, area, censusDataset, '/profile'); // fetch the total population of people age 25+

    const age25PlusLessThan9thGrade = await getCensusData(censusVars.age25PlusLessThan9thGrade, area, censusDataset, '/profile'); // fetch the number of people age 25+ who have attained less than a 9th grade education
    const age25Plus9thTo12thGradeNoDiploma = await getCensusData(censusVars.age25Plus9thTo12thGradeNoDiploma, area, censusDataset, '/profile'); // fetch the number of people age 25+ who have attained up to a 12th grade education without a high school diploma

    const numNoHighSchoolDiplomaOrEquivalent = age25PlusLessThan9thGrade + age25Plus9thTo12thGradeNoDiploma; // add up the number of people who do not possess a high school diplomam or its equivalent

    done(null, {
        ...libraryData,
        noHighSchoolDiplomaOrEquivalent: (numNoHighSchoolDiplomaOrEquivalent/totalPop*100).toFixed(1) // calculate and assign the percentage of people who do not possess a high school diploma or its equivalent
    });
}

export { getCensusPoverty, getUnemployment, getLimitedEnglishProficiency, getLessThanHighSchoolDiploma }