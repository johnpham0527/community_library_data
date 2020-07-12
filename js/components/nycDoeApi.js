const appToken = 'QoQet97KEDYpMW4x4Manaflkp'; //this is my (John Pham's) NYC Open Data app token

async function getLibraryZipCode(libraryData) { //given a library's name, return the ZIP code

    if (libraryData.shortLibraryName === 'Hunters Point') { // implement hard code for Hunters Point, since the library is so new that NYC Open Data doesn't have information on it
        return 11109;
    }

    let data = await $.getJSON(`https://data.cityofnewyork.us/resource/b67a-vkqb.json?name=${libraryData.shortLibraryName}&$$app_token=${appToken}&$limit=1`);
    return data[0]["postcode"];
};

async function getNycDoeSchoolsDataByZipCode(zipCode) { //return data on the public schools located in a given ZIP code
    return await $.getJSON(`https://data.cityofnewyork.us/resource/r2nx-nhxe.json?location_1_zip=${zipCode}&$$app_token=${appToken}&$limit=5000`);
}

async function getSchoolDataByDbn(dbn, year) { //return data on a school, given the DBN and dataset year
    return await $.getJSON(`https://data.cityofnewyork.us/resource/45j8-f6um.json?dbn=${dbn}&year=${year}&$$app_token=${appToken}&$limit=1`);
}

async function getNycDoePoverty(libraryData) {
    const { zipCode, nycDoeDataset } = libraryData; //destructure libraryData to obtain the ZIP code and dataset year
    let povertyCountSum = 0;
    let enrollmentSum = 0;
    let promises = []; //we will populate this promises array with promises returned by getSchoolDataByDbn

    try {
        let schools = await getNycDoeSchoolsDataByZipCode(zipCode); //retrieve an array of schools filtered by the given ZIP code
        let numSchools = schools.length; // this variable will keep track of the number of schools with valid data

        for (let i = 0; i < numSchools; i++) { //run a for-loop through the schools array. For each school in the school array:
            let schoolDBN = schools[i]['ats_system_code']; //find the schoolDBN for each school
            let modifiedSchoolDBN = $.trim(schoolDBN); //remove white space from school DBN
            if (modifiedSchoolDBN === '24Q877') { // data on this school in Elmhurst, Queens doesn't exist
                numSchools--; // reduce schools array length by 1
            }
            else {
                let selectDatasetYear = nycDoeDataset.slice(0,5) + nycDoeDataset.slice(7); //slice the dataset year; format is '2018-19'
                promises.push(getSchoolDataByDbn(modifiedSchoolDBN, selectDatasetYear) //fetch that school's record from the NYC DOE Demographic Snapshot dataset
                    .then(schoolData => { //sum up the povertyCount and enrollment for each school
                        povertyCountSum += parseInt(schoolData[0]["poverty"]); //obtain the number of students in the school who meet the DOE's poverty criteria. Add this number to a poverty count sum variable.
                        enrollmentSum += parseInt(schoolData[0]["total_enrollment"]); //obtain the school's total enrollment and add it to an enrollment sum variable
                    })
                )
            }
        }

        return Promise.all(promises) //execute all of the promises in the array
            .then(() => {
                return { //execute the callback, passing along null for error and updated data
                    ...libraryData, //use the spread operator and avoid mutating libraryData
                    schoolsInZipCode: numSchools, //store the number of schools in the global variable
                    nycDoePovertyRate: (povertyCountSum/enrollmentSum*100).toFixed(1) //calculate the poverty percentage to one decimal place and pass it into the callback
                }
            })
    }
    catch(err) {
        console.error(`Error retrieving NYC DOE data. Status: ${err.status}. Error: ${err.statusText}`);
    } 
}

export { getLibraryZipCode, getNycDoePoverty };