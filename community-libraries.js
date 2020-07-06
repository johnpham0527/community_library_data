/* Sample view of the API endpoint:
https://data.cityofnewyork.us/resource/b67a-vkqb.json?name=Arverne&$$apptoken=QoQet97KEDYpMW4x4Manaflkp 
*/
          
let schoolsInZIPCode = 0;
const nycOpenData = 'https://data.cityofnewyork.us/resource/';
const appToken = 'QoQet97KEDYpMW4x4Manaflkp'; //This is my (John Pham's) NYC Open Data app token

async function getLibraryZipCode(libraryName) { //given a library's name, return the ZIP code
    let data = await $.ajax({ //fetch the library from the API
        url: `${nycOpenData}b67a-vkqb.json?name=${libraryName}`,
        type: "GET",
        data: {
            "$limit" : 1,
            "$$app_token": appToken 
        }
    });
    return data[0]["postcode"];
};

function getNYCDOEPovertyRateByZIPCode(ZIPCode, datasetYear) {
    var povertyCountSum = 0;
    var enrollmentSum = 0;
    var buildURL = "https://data.cityofnewyork.us/resource/r2nx-nhxe.json?location_1_zip=" + ZIPCode; //this dataset contains general information about all NYC DOE schools. See https://data.cityofnewyork.us/Education/2017-2018-School-Locations/p6h4-mpyy
    //var buildURL = "https://data.cityofnewyork.us/resource/45j8-f6um.json?location_1_zip=" + ZIPCode; //this dataset contains general information about all NYC DOE schools. See https://data.cityofnewyork.us/Education/2017-2018-School-Locations/p6h4-mpyy
    $.ajax({
        url: buildURL,
        async: false,
        type: "GET",
        data: {
            "$limit" : 5000,
            "$$app_token" : "QoQet97KEDYpMW4x4Manaflkp" //This is my (John Pham's) app token
        },
    }).done(function(data) {
        schoolsInZIPCode = data.length; //store the number of schools in the global variable

        /* At this point, we have now retrieved an array of schools filtered by the given ZIP code. Here is the pseudocode for the below section:
            Run a for-loop through this array. For each school in the school array:
                Make an AJAX request on that school's record from the NYC DOE Demographic Snapshot dataset
                Obtain the school's total enrollment and add it to an enrollment sum variable
                Obtain the number of students in the school who meet the DOE's poverty criteria. Add this number to a poverty count sum variable.
            Divide the poverty count sum by the enrollment sum. Append this response to the web page.
        */

        $.each(data, function(school) {
            var schoolDBN = data[school]["ats_system_code"];
            var modifiedSchoolDBN = $.trim(schoolDBN); //remove white space from school DBN

            var selectDatasetYear = "2017-18"; //this is the default dataset to use
            switch(datasetYear) {
                case "2017-2018 School Year":
                    selectDatasetYear = "2017-18";
                    break;
                case "2016-2017 School Year":
                    selectDatasetYear = "2016-17";
                    break;
            }

            buildURL = "https://data.cityofnewyork.us/resource/s52a-8aq6.json?dbn=" + modifiedSchoolDBN + "&year=" + selectDatasetYear; //this dataset contains the NYC DOE's Demographic Snapshot.
            $.ajax({
                url: buildURL,
                async: false,
                type: "GET",
                data: {
                    "$limit" : 5000,
                    "$$app_token" : "QoQet97KEDYpMW4x4Manaflkp" //This is my (John Pham's) app token
                },
            }).done(function(data) {

                let schoolPovertyCount = parseInt(data[0]["poverty_1"]);
                povertyCountSum += schoolPovertyCount;
                let schoolEnrollment = parseInt(data[0]["total_enrollment"]);
                enrollmentSum += schoolEnrollment;
            });
        });

    });
    return (povertyCountSum/enrollmentSum*100).toFixed(1); //return a whole number, not a number less than 1
};

function getAmericanCommunitySurvey5YearEstimateValue(datasetYear, tableNumber, zipCode) {
    var selectDatasetYear = "17"; //this is the default dataset year to use
    var returnValue = 0;

    switch(datasetYear) {
        case "2017 Five-Year Estimates":
            selectDatasetYear = "17";
            break;
        case "2016 Five-Year Estimates":
            selectDatasetYear = "16";
    break;
    }
    
    var buildURL1 = "http://factfinder.census.gov/service/data/v1/en/programs/ACS/datasets/" + selectDatasetYear + "_5YR/tables/";
    var buildURL2 = "/data/8600000US" + zipCode + "?maxResults=1&key=" + "ea46e190165e1ee608d643fba987f8b3620ec1a9";
    var buildURLFinal = buildURL1 + tableNumber.toString() + buildURL2;
    
    $.ajax({
        url: buildURLFinal,
        async: false,
        type: "GET",
        success: function(data) {
            
            switch(tableNumber) {
            case "S2301": //American Community Survey dataset for unemployment rate
                returnValue = data.data.rows[0].cells.C7.value;
                break;
            case "S1501": //American Community Survey dataset for educational attainment
                var value1 = data.data.rows[0].cells.C75.value; //the percentage of people age 25+ who have less than a 9th grade education
                var value2 = data.data.rows[0].cells.C87.value; //the percentage of people age 25+ who have a 9th-12th grade education but lack a high school diploma or its equivalent
                var value3 = parseFloat(value1) + parseFloat(value2); //add the two values together
                returnValue = value3.toFixed(1);
                break;
            case "S1701": //American Community Survey dataset for poverty
                returnValue = data.data.rows[0].cells.C5.value; //percentage of population for whom poverty status is determined who earned an income at the poverty level or lower
                break;
            case "DP02": //American Community Survey dataset called "Selected Social Characteristics in the United States"
                returnValue = data.data.rows[0].cells.C411.value; //percentage of people age 5 and older who speak English less than "very well," among those people who speak a language other than English
                break;
            }//closes the switch statement
            } //closes success
            })//closes the AJAX call's property list
    return returnValue;
}; //closes the function

$(document).ready(function(){
    //$("input[type='button']").click(function() {
    $("input[id='ViewCommunityProfile']").click(function() {
        $("#Intro").html("Please wait...");
                                    
        //clear previous results after the button is clicked each time
        $("#ZIP").html("");
        $("#DOESnapshotA").html(""); 
        $("#DOEPoverty").html(""); 
        $("#DOESnapshotB").html(""); 
        $("#NumSchools").html("");
        $("#DOESnapshotC").html(""); 
        $("#Test").html("");
        $("#DOESnapshotD").html(""); 
        $("#ACS1").html("");
        $("#ACSdataset").html("");
        $("#ACS2").html("");
        $("#Unemployment").html("");
        $("#ACS3").html("");
        $("#NoHS").html("");
        $("#ACS4").html("");
        $("#ACSPoverty").html("");
        $("#ACS5").html("");
        $("#LimitedEnglish").html("");
        $("#ACS6").html("");
        
        var NYCDOEDataset = $("input[name='NYCDOEDataset']:checked").val();
        var ACSdataset = $("input[name='ACSDataset']:checked").val();
        var shortLibraryName = $("select.communityLibrary").val();
        var fullLibraryName = shortLibraryName;
        if (shortLibraryName != "Central Library") {
            fullLibraryName = shortLibraryName + " Community Library"; //generate the library's full name if it is not the Central Library
        }

        getLibraryZipCode(shortLibraryName) //Query the NYC DOE data to obtain the ZIP code.
            .then(zipCode => {
                var NYCDOEPovertyRate = getNYCDOEPovertyRateByZIPCode(zipCode, NYCDOEDataset); //Query the NYC DOE data to obtain the student poverty percentage.
                var unemploymentRate = getAmericanCommunitySurvey5YearEstimateValue(ACSdataset,"S2301",zipCode);
                var percentageNoHSDiploma = getAmericanCommunitySurvey5YearEstimateValue(ACSdataset,"S1501",zipCode); //S1501 is the American Community Survey table number for educational attainment
                var ACSPovertyRate = getAmericanCommunitySurvey5YearEstimateValue(ACSdataset, "S1701", zipCode); //S1701 is the American Community Survey table number for poverty
                var limitedEnglishProfiencyRate = getAmericanCommunitySurvey5YearEstimateValue(ACSdataset, "DP02", zipCode); //DP02 is the American Community Survey for U.S. general social characteristics
        
                $("#Intro").html(fullLibraryName + " is located in ZIP Code ");
                $('#ZIP').append(zipCode); 
                $("#DOESnapshotA").append(". According to the NYC Department of Education's " + NYCDOEDataset + " Demographic Snapshot, ");
                $("#DOEPoverty").append(NYCDOEPovertyRate);
                $("#DOESnapshotB").append("% of the students who attend the ");
                $("#NumSchools").append(schoolsInZIPCode); 
                
                let schools = schoolsInZIPCode === 1 ? 'school' : 'schools'; //make school plural if there is more than one school
                
                $("#DOESnapshotD").append(` public ${schools} located in this ZIP code receive free or reduced lunch or are eligible for NYC Human Resources Administration public benefits.`);
                $("#ACS1").append(" According to the American Community Survey ");
                $("#ACSdataset").append(ACSdataset);
                $("#ACS2").append(", the ZIP code's unemployment rate is ");
                $("#Unemployment").append(unemploymentRate);
                $("#ACS3").append("%; ");
                $("#NoHS").append(percentageNoHSDiploma);
                $("#ACS4").append("% of residents do not possess a high school diploma or its equivalent; ");
                $("#ACSPoverty").append(ACSPovertyRate);
                $("#ACS5").append("% of residents live below the poverty line; and ");
                $("#LimitedEnglish").append(limitedEnglishProfiencyRate);
                $("#ACS6").append("% of residents speak English less than very well."); 
            })

    });
});