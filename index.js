$(() => {

    /* Variables*/
    let seperatedCoins = [];
    let trackedCoins = [];
    let switchCoins;
    let randmNumber = [];
    let r;
    let getValuesForReports;
    let unableToTrackCoins = [];


    /* Functions */
    // main function to load the coins to the main page, and save them to arrays
    function constructingCoins() {
        $('.loadingScreen').removeClass("d-none");
        $('.mainContent').empty();
        i = 0; // reset i every time you load the coins
        $('.mainContent').append(`
            <div class="coins d-flex justify-content-center flex-wrap"></div>
        `)
        // get each coin from the general coins array
        for (const singleCoin of seperatedCoins) {
            $(".coins").append(`
            <div id="accordion${i}" class="d-inline-block m-3 singleCoin accordion${i}">
                <div class="card">
                    <div class="card-header" id="heading${i}">
                        <h5 class="mb-0">
                            <h5 class="card-title d-flex justify-content-between mb-0">${singleCoin.symbol.toUpperCase()}
                                <ul class="tg-list">
                                    <li class="tg-list-item">
                                        <input class="tgl tgl-flip cb${i}" id="cb${i}" type="checkbox" /><label class="tgl-btn" data-tg-off="Off" data-tg-on="Tracking" for="cb${i}"></label>
                                    </li>
                                </ul>
                            </h5>
                            <p class="mb-3">${singleCoin.id.charAt(0).toUpperCase()+singleCoin.id.slice(1)}</p>
                            <button class="btn btn-link moreInfoBtn${i}" data-toggle="collapse" data-target="#collapse${i}" aria-expanded="true" aria-controls="collapse${i}">
                                More Info
                            </button>
                        </h5>
                    </div>
                
                    <div id="collapse${i}" class="collapse" aria-labelledby="heading${i}" data-parent="#accordion${i}">
                        <div class="card-body coinInformation${i} d-flex justify-content-between">
                        </div>
                        <div class="loader d-none">
                            <div class="inner one"></div>
                            <div class="inner two"></div>
                            <div class="inner three"></div>
                        </div>
                    </div>
                </div>
            </div>
            `)
            // add click event to the more info button
            $(`.moreInfoBtn${i}`).click(function(e) {
                let coinInformationDiv = $(this).parent().parent().children().eq(1).children().eq(0)
                let keyNameInLS = JSON.parse(localStorage.getItem($(this).parent().children().eq(1).text().trim()))
                coinInformationDiv.empty()
                $(this).parent().parent().children(1).children(1).eq(5).removeClass("d-none")
                // checking if there is a key by the same name in the local storage, and that the data is not expired (more than 2 minutes)
                if(localStorage.getItem($(this).parent().children().eq(1).text().trim()) && keyNameInLS.time + 120 * 1000 > new Date().getTime()){
                    $(".loader").addClass("d-none");
                    coinInformationDiv.append(`
                        <img src="${keyNameInLS.src}" alt="coin image">
                    `)
                    // checking if there are coin values in the key
                    if(keyNameInLS.usd && keyNameInLS.eur && keyNameInLS.ils){
                        coinInformationDiv.append(`
                            <div class="coinRates">
                                    USD: ${keyNameInLS.usd}$
                                <br>
                                    EUR: ${keyNameInLS.eur}€
                                <br>
                                    ILS: ${keyNameInLS.ils}&#8362;
                            </div>
                        `)
                    }else{
                        coinInformationDiv.append(`
                            This website has no information about this coin's value, sorry for the inconvenience.
                        `)
                    }
                }else{
                    // in case there is no key for the coin, or the data is expired, it takes the information from the api
                    $.get(`https://api.coingecko.com/api/v3/coins/${$(this).parent().parent().children(0).children().eq(2).text().toLowerCase()}`, (e) => {
                        $(".loader").addClass("d-none");
                        coinInformationDiv.append(`
                            <img src="${(e.image.small)}" alt="coin image">
                        `)
                        // checking if the coin has values for USD, ILS, and EUR
                        if(!e.market_data.current_price.usd && !e.market_data.current_price.eur && !e.market_data.current_price.ils){
                            coinInformationDiv.append(`
                                This website has no information about this coin's value, sorry for the inconvenience.
                            `)
                        }else{
                            coinInformationDiv.append(`
                                <div class="coinRates">
                                        USD: ${e.market_data.current_price.usd}$
                                    <br>
                                        EUR: ${e.market_data.current_price.eur}€
                                    <br>
                                        ILS: ${e.market_data.current_price.ils}&#8362;
                                </div>
                            `)
                        }
                        // adding the information to the local storage
                        localStorage.setItem($(this).parent().children().eq(1).text().trim(), JSON.stringify({src: e.image.small, usd: e.market_data.current_price.usd, eur:e.market_data.current_price.eur, ils:e.market_data.current_price.ils, time: new Date().getTime()}))
                    })
                }
            })
            // checking if there are any coins you are tracking to mark them when you go to the home screen
            if(trackedCoins.includes(singleCoin.symbol.toUpperCase())){
                $(`.cb${i}`).prop("checked", true)
            }else{}
            // checking if there are any coins without value to mark them as unable to track and disable them
            if(unableToTrackCoins.includes(singleCoin.symbol.toUpperCase())){
                $(`.cb${i}`).prop("disabled", true)
                $(`.cb${i}`).parent().children(1).attr("data-tg-off","Unable")
            }else{}
            // add click event to the toggle
            $(`.cb${i}`).click((e) => {
                // at first it checks if the coin is in the list of the other api, and that it has USD value
                $.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${$(e.target).parent().parent().parent().text().trim()}&tsyms=USD`, (coinToCompare) => {  
                coinName = $(e.target).parent().parent().parent().text().trim();
                    // if not it disable the toggle and change the text to "Unable"
                    if(!!!coinToCompare[coinName]){
                        $(e.target).prop("disabled", true);
                        $(e.target).prop("checked", false);
                        $(e.target).parent().children(1).attr("data-tg-off","Unable")
                        unableToTrackCoins.push(coinName)
                    }else{
                        // if it has values, it checks if you toggled on or off, and that you didn't exceed the limit of 5. if you did, it will show an alert
                        if ($(e.target).prop("checked") && trackedCoins.length<5) {
                            trackedCoins = [...trackedCoins, coinName]
                        }else if (!$(e.target).prop("checked")) {
                            for (const coin of trackedCoins) {
                                if (coin === coinName){
                                    trackedCoins.splice(trackedCoins.indexOf(coin),1)
                                }
                            }
                        }else {
                            // if you chose more than 5 coins an alert will pop up
                            switchCoins = e.target
                            $(e.target).prop("checked", false)
                            $('.mainContent').append(`
                                <div class="alertMessage position-fixed d-flex justify-content-center align-items-center w-100 h-100">
                                    <div class="alert alert-success" role="alert">
                                        <h4 class="alert-heading">You can't choose more than five coins to track!<h6>After the project you'll be able to get the premium version. For now you can choose coins to untrack or close this window.</h6></h4>
                                        <hr>
                                        <p class="coinsChosen"></p>
                                        <div class="options d-flex justify-content-around">
                                            <button class="btn btn-success btnApplyChanges" disabled>Apply</button>
                                            <button class="btn btn-danger closeAlert">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            `)
                            $(".container-fluid").bind("wheel",(e) => {
                                e.preventDefault()
                            });
                            $(".navigation").removeClass("sticky-top") //
                            $(".coinsChosen").html("")
                            let trackID = 0;
                            for (const coin of trackedCoins) {
                                trackID++
                                $(".coinsChosen").append(`
                                    <div class="d-flex justify-content-between align-items-center coinsToRemove m-auto">
                                        ${coin}
                                        <ul class="tg-list">
                                            <li class="tg-list-item">
                                                <input class="tgl tgl-flip cbi${trackID}" id="cbi${trackID}" type="checkbox"  checked /><label class="tgl-btn" data-tg-off="Off" data-tg-on="Tracking" for="cbi${trackID}"></label>
                                            </li>
                                        </ul>
                                    </div>
                                    <hr class="lineBreak">
                                `)
                            }

                            $(".closeAlert").click(() => {
                                closeAlert()
                            })
                        
                            // add click event to the apply button in the popup alert
                            $('.btnApplyChanges').click((e) => {
                                for (const coinChosen of $('.coinsChosen').children().not($('.lineBreak'))) {
                                    if($(coinChosen).children(0).children(0).children().eq(0).prop("checked")){
                        
                                    }else{
                                        if ($(switchCoins).prop("checked")){
                                            
                                        }else{
                                            $(switchCoins).prop("checked", true)
                                            trackedCoins = [...trackedCoins, $(switchCoins).parent().parent().parent().text().trim()]
                                        }
                                        trackedCoins.splice(trackedCoins.indexOf($(coinChosen).text().trim()),1)
                                        for (const coin of $('.coins').children()) {
                                            if($(coinChosen).text().trim() == $(coin).children(0).children(0).children().eq(1).text().trim()){
                                                $(coin).children(0).children(0).children(1).children(0).children(0).children().eq(0).prop("checked", false)
                                            }else{
                                            }
                                        }
                                    }
                                }
                                closeAlert()
                            })
                            trackCoinsEvents()
                        }
                    }
                })

            })
            i++
            $('.loadingScreen').addClass("d-none");
        }
    }


    // add click event to the coins in the alert popup, to disable or enable the apply button
    function trackCoinsEvents() {
        for (const chosenCoin of $('.coinsChosen').children().not($('.lineBreak'))) {
            $(chosenCoin).children(0).click((e) => {
                for (const coinCheck of $('.coinsChosen').children().not($('.lineBreak'))) {
                    if($(coinCheck).children(0).children(0).children(0).eq(0).prop("checked")){
                        $('.btnApplyChanges').prop('disabled', true)
                    }else{
                        $('.btnApplyChanges').prop('disabled', false)
                        break;
                    }
                }
            })
        }
    }


    // close the alert message
    function closeAlert() {
        $(".alertMessage").remove();
        $('.btnApplyChanges').prop('disabled', true)
        $(".container-fluid").unbind("wheel");
        $(".navigation").addClass("sticky-top")
    }





    /* Main Code and Events */
    //  generate 100 random coins and build them
    $.get("https://api.coingecko.com/api/v3/coins/list", (coins) => {
        for(i=0; i<100; i++){
            r = Math.floor(Math.random()*5853)
            while(randmNumber.includes(r)){
                r = Math.floor(Math.random()*5853)
            }
            randmNumber = [...randmNumber, r]
            seperatedCoins.push((coins[r]))
        }
        constructingCoins()
    })

    




    // key up search
    $(".searchBox").on("keyup", (e) => {
        $('.loadingScreen').removeClass("d-none");
        let coinCounter=-1;
        for (const coin of seperatedCoins) {
            coinCounter++;
            if(coin.symbol.search($(e.target).val())>0) {
                $(`.accordion${coinCounter}`).removeClass("d-none");
                $(`.accordion${coinCounter}`).addClass("d-inline-block");
            }else if(coin.symbol.search(e.target.value)==-1){
                $(`.accordion${coinCounter}`).addClass("d-none");
                $(`.accordion${coinCounter}`).removeClass("d-inline-block");
            }else if(coin.symbol.search(e.target.value)==0){
                $(`.accordion${coinCounter}`).removeClass("d-none");
                $(`.accordion${coinCounter}`).addClass("d-inline-block");
            }
        }
        $('.loadingScreen').addClass("d-none");
    })


    // add your own coin function
    $('.addCoinToTheList').click((e) => {
        $('.addCoinToTheList').toggleClass('animate');
        if(!!$('.addCoinSearch').val()){
            $.get(`https://api.coingecko.com/api/v3/coins/${$('.addCoinSearch').val().toLowerCase()}`, (coinData) => {
                let searchCoinCounter = 0
                for (const coin of seperatedCoins) {
                    if(coin.symbol == coinData.symbol) {
                        searchCoinCounter++
                    }else{}
                }
                if(searchCoinCounter == 0){
                    let {id, symbol, name} = coinData
                    newCoin = {id: id, symbol: symbol, name: name}
                    seperatedCoins.push(newCoin)
                    constructingCoins()
                    $('.addCoinSearch').val("")
                    $('.demo p:nth-of-type(2)').remove()
                    $('.demo').append(`
                        <p class="text-success">Coin added Successfully!</p>                    
                    `)
                    $('.addCoinSearch').val("")
                }else{
                    $('.demo p:nth-of-type(2)').remove()
                    $('.demo').append(`
                        <p class="text-danger m-0">You already have this coin!</p>
                    `)
                }
            })
        }else{
            $('.demo p:nth-of-type(2)').remove()
            $('.demo').append(`
                <p class="text-danger">This field is mandatory!</p>
            `)

        }
    })

    // remove any messages inside the div
    $('.addCoinBtn').on('click', () => {
        $('.demo p:nth-of-type(2)').remove()
    })

    // catch an error from this api, and display error message
    $(document).ajaxError(( event, request, settings ) => {
        if(settings.url.search("https://api.coingecko.com/api/v3/coins") >= 0){
            $('.demo p:nth-of-type(2)').remove()
            $('.demo').append(`
                <p class="text-danger m-0">Could not find coin ID, please try again!</p>
            `)
        }
    })



    // home page
    $('.homeBtn').click((e) => {
        clearInterval(getValuesForReports)
        constructingCoins()
    })

    // pressing on the title will get you to home page
    $('.headerTitle').click((e) => {
        clearInterval(getValuesForReports)
        constructingCoins()
    })

    // back to top function
    $(window).scroll(() => {
        if ($(window).scrollTop() > 50) {
            $('.backToTopBtn').addClass('show');
        } else {
            $('.backToTopBtn').removeClass('show');
        }
    });

    // back to top button function
    $('.backToTopBtn').on('click', (e) => {
        e.preventDefault();
        $('html, body').animate({scrollTop:0}, '300');
    });


    // reports page
    $(".reportsBtn").click(() => {
        if(trackedCoins.length == 0) {
            $('.mainContent').append(`
                <div class="alertMessage position-fixed d-flex justify-content-center align-items-center w-100 h-100">
                    <div class="alert noReportsAlert" role="alert">
                        <h4 class="alert-heading noReportAlertHeading">You didn't choose any coins to track!</h6></h4>
                        <div class="options d-flex justify-content-center">
                            <button class=" btn btn-info closeAlert">Close</button>
                        </div>
                    </div>
                </div>
            `)
            $(".closeAlert").click(() => {
                closeAlert()
            })
        }else{
            $('.loadingScreen').removeClass("d-none");
            $(".mainContent").empty();
            $(".mainContent").append(`
                <div class="chartWrapper d-flex align-items-center">
                    <div id="chartContainer" style="height: 370px; width: 100%;"></div>
            `);
                
            // generate the chart
            let chart = new CanvasJS.Chart("chartContainer", {
                exportEnabled: true,
                animationEnabled: true,
                title:{
                    text: `${trackedCoins.join(", ")} to USD`
                },
                subtitles: [{
                    text: "Click Legend to Hide or Unhide Data Series"
                }],
                axisX: {
                    title: "Time"
                },
                axisY: {
                    title: "Coin Value in USD",
                    titleFontColor: "#4F81BC",
                    lineColor: "#4F81BC",
                    labelFontColor: "#4F81BC",
                    tickColor: "#4F81BC",
                },
                toolTip: {
                    shared: true
                },
                legend: {
                    cursor: "pointer",
                    itemclick: toggleDataSeries
                },
                data: []
            });
            for (const coinSymbol of trackedCoins) {
                chart.options.data.push(
                    {
                        type: "spline",
                        name: `${coinSymbol}`,
                        showInLegend: true,
                        xValueFormatString: "mm:ss",
                        yValueFormatString: "###.### USD",
                        dataPoints: []
                    }
                )
                
            }

            setTimeout(() => {
                $('.loadingScreen').addClass("d-none");
            }, 2000)

            // update the data every 2 seconds
            getValuesForReports = setInterval(() => {
                $.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${trackedCoins.join(",").toLowerCase()}&tsyms=USD`, (values) => {
                    for (const [coin, value] of Object.entries(values)) {
                            for (const dataName of chart.options.data) {
                                if(coin == dataName.name){
                                    dataName.dataPoints.push({ x: new Date, y : value.USD})
                                    if(dataName.dataPoints.length > 10) {
                                        dataName.dataPoints.shift()
                                    }else{}
                                    chart.render()
                                }else{}
                            }
                    }
                })
            }, 2000)

            // hide/unhide coin from the report
            function toggleDataSeries(e) {
                if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                    e.dataSeries.visible = false;
                } else {
                    e.dataSeries.visible = true;
                }
                e.chart.render();
            }
        }  
    })


    // about the project label
    $('.aboutBtn').click((e) => {
        $('.loadingScreen').removeClass("d-none");
        clearInterval(getValuesForReports)
        $('.mainContent').empty();
        $('.mainContent').append(`
            <div class="aboutTheProjectContainer d-flex align-items-center justify-content-center">
                <div class="aboutTheProject p-3 d-flex justify-content-between align-items-center flex-wrap rounded">
                    <div class="aboutTheProjectTitleAndContent d-flex flex-wrap">
                        <h3>Stock Market Project</h2>
                        <p>My name is Nimrod Rokach, I've created this project as part of my studies in John Bryce College.
                        <br>
                        In this project I used jQuery and ajax to extract data from two APIs, and Bootstrap for design. In this project you can see the current value of coins, that were randomly selected from one API. The second API is used to show an updating data for selected coins in the "Reports" page, up to five coins can be selected. The APIs are not synced, therefore not all coins can be tracked, and in that case, the toggle will be changed to "Unable", and will be disabled. If you want a specific coin, you can add it by going to "Can't find your coin?" on the top right, and enter your coin ID.<br>Hope you enjoyed the project!
                        <br>
                        <br>
                        CodePen Credits: 
                        <br>
                        · Mauricio Allende for the <a href="https://codepen.io/mallendeo/pen/eLIiG" target=" ">Toggle</a> <br>
                        · Martin van Driel for the <a href="https://codepen.io/martinvd/pen/xbQJom" target=" ">Galaxy-loader</a> <br>
                        · UCanCode for the <a href="https://codepen.io/FauxyCoder/pen/LYYmKJG" target=" ">Wave-loader</a> <br>
                        · David Conner for the <a href="https://codepen.io/davidicus/pen/emgQKJ" target=" ">Button design</a> <br>
                        · MrPirrera for the <a href="https://codepen.io/pirrera/pen/bqVeGx" target=" ">Button design</a> <br>
                        · Michael for the <a href="https://codepen.io/Benaud12/pen/RLZZWa" target=" ">Plus button</a></p>
                    </div>
                    <div class="aboutTheProjectImg">
                        <img class="rounded-circle" src="small2.jpg" alt="My Picture"/>
                    </div>
                </div>
            </div>
        `);
        $('.loadingScreen').addClass("d-none");
    })
})