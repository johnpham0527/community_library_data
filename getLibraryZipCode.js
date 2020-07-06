function getLibraryZipCode(libraryName) { //given a library's name, return the ZIP code
    var ZIPCode = 0;
    var buildURL = "https://data.cityofnewyork.us/resource/b67a-vkqb.json?name=" + libraryName; //build a URL that queries the selected library from the API endpoint
    $.ajax({
        url: buildURL,
        async: false,
        type: "GET",
        data: {
            "$limit" : 5000,
            "$$app_token" : "QoQet97KEDYpMW4x4Manaflkp" //This is my (John Pham's) app token
        },
    }).done(function(data) {
        ZIPCode = data[0]["postcode"];
    });
    return ZIPCode;
};

export default getLibraryZipCode;