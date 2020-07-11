const qplLibraries = [
    'Arverne',
    'Astoria',
    'Auburndale',
    'Baisley Park',
    'Bay Terrace',
    'Bayside',
    'Bellerose',
    'Briarwood',
    'Broad Channel',
    'Broadway',
    'Cambria Heights',
    'Central Library',
    'Corona',
    'Court Square',
    'Douglaston/Little Neck',
    'East Elmhurst',
    'East Flushing',
    'Elmhurst',
    'Far Rockaway',
    'Flushing',
    'Forest Hills',
    'Fresh Meadows',
    'Glen Oaks',
    'Glendale',
    'Hillcrest',
    'Hollis',
    'Howard Beach',
    'Hunters Point',
    'Jackson Heights',
    'Kew Gardens Hills',
    'Langston Hughes',
    'Laurelton',
    'Lefferts',
    'Lefrak City',
    'Long Island City',
    'Maspeth',
    'McGoldrick',
    'Middle Village',
    'Mitchell-Linden',
    'North Forest Park',
    'North Hills',
    'Ozone Park',
    'Peninsula',
    'Pomonok',
    'Poppenhusen',
    'Queens Village',
    'Queensboro Hill',
    'Rego Park',
    'Richmond Hill',
    'Ridgewood',
    'Rochdale Village',
    'Rosedale',
    'Seaside',
    'South Hollis',
    'South Jamaica',
    'South Ozone Park',
    'St. Albans',
    'Steinway',
    'Sunnyside',
    'Whitestone',
    'Windsor Park',
    'Woodhaven',
    'Woodside'
]

let allLibraryData = {}; // this object will store a hash map of libraryData objects for each QPL community library

qplLibraries.forEach(shortLibraryName => { //for each library in the qplLibraries array
    let libraryData = {
        schoolsInZipCode: 0, // variable for counting number of schools in a ZIP code
        nycDoeDataset: '2018-2019',
        censusDataset: '2018',
        shortLibraryName: shortLibraryName,
        fullLibraryName: shortLibraryName === 'Central Library' ? // generate each library's full name using a ternary operator
            shortLibraryName : shortLibraryName + ' Community Library' // generate the library's full name if it is not the Central Library
    }

    getLibraryZipCode(libraryData) // query the NYC DOE data to obtain the ZIP code.
    .then(async zipCode => {
        libraryData.zipCode = zipCode;

        return await getNycDoePoverty(libraryData) //assign this promise chain to libraryData object
            .then(libraryData => getCensusPoverty(libraryData))
            .then(libraryData => getUnemployment(libraryData))
            .then(libraryData => getLimitedEnglishProficiency(libraryData))
            .then(libraryData => getLessThanHighSchoolDiploma(libraryData))
            .then(libraryData => outputProfile(libraryData));
    })

    allLibraryData.shortLibraryName = libraryData;
})

console.log(`allLibraryData is ${allLibraryData}`);