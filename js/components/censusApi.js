/*** Global variables */
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

export { getCensusFiveYearPoverty, getCensusFiveYearUnemployment }