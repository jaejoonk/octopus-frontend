// from /api/v1/markets
const MARKETS = {
                    AMAZON: 1,
                    WALMART: 2,
                    WEBSITE: 3,
                    MX_AMAZON: 4,
                    MX_EBAY: 5,
                    MX_WALMART: 6,
                    EBAY: 7,
                    SEARS: 8
                };

function collectData(allData) {
    var bySku = {};
    
    // loop through every entry in allData
    for (var key in Object.keys(allData)) {
        if ("market" in allData[key] && "orderItems" in allData[key]) {
            var marketid = allData[key]["market"]["marketId"];
            // loop through each order in orderItems
            for (var orderKey in Object.keys(allData[key]["orderItems"])) {
                // shorthand
                var orderData = allData[key]["orderItems"][orderKey];
                if (orderData["inventory"] == null) {
                    continue;
                }

                // if existing entry in bySku doesn't exist
                if (!(orderData["listingSku"] in bySku)) {
                    bySku[orderData["listingSku"]] = { "name": "", 
                                                       "amazon": 0, "ebay": 0,
                                                       "sears": 0, "walmart": 0,
                                                       "website": 0, "mx_amazon": 0,
                                                       "mx_ebay": 0, "mx_walmart": 0
                                                     };
                    
                }
                // add product name
                bySku[orderData["listingSku"]]["name"] = orderData["inventory"]["productName"];

                // add entry in bySku
                var qty = orderData["unitQuantity"];
                switch(marketid) {
                    case MARKETS.AMAZON:
                        bySku[orderData["listingSku"]]["amazon"] += qty;
                        break;
                    case MARKETS.EBAY:
                        bySku[orderData["listingSku"]]["ebay"] += qty;
                        break;
                    case MARKETS.SEARS:
                        bySku[orderData["listingSku"]]["sears"] += qty;
                        break;
                    case MARKETS.WALMART:
                        bySku[orderData["listingSku"]]["walmart"] += qty;
                        break;
                    case MARKETS.WEBSITE:
                        bySku[orderData["listingSku"]]["website"] += qty;
                        break;
                    case MARKETS.MX_AMAZON:
                        bySku[orderData["listingSku"]]["mx_amazon"] += qty;
                        break;
                    case MARKETS.MX_EBAY:
                        bySku[orderData["listingSku"]]["mx_ebay"] += qty;
                        break;
                    case MARKETS.MX_WALMART:
                        bySku[orderData["listingSku"]]["mx_walmart"] += qty;
                        break;
                    default:
                        break;
                }

            }
        }
    }

    return bySku;
}

// used to organize formattedRows data into appropriate columns
// calculate total sold items
function rowsToDisplay(rowsDict) {
    // key = stdSku
    // val = dict("name", "amazon", "ebay", "sears", "walmart",
    //            "website", "mx_amazon", "mx_ebay", "mx_walmart")

    return Object.entries(rowsDict).map(
        ([k, v]) => { 
            var L = [k, k, v['name'], v['amazon'], v['ebay'],
                     v['sears'], v['walmart'], v['website'],
                     v['mx_amazon'], v['mx_ebay'], v['mx_walmart']];
            // calculate total
            L.splice(3, 0, L.slice(-8).reduce((a,b) => a+b, 0));
            return L;
        }            
    )
}

export { collectData, rowsToDisplay };

