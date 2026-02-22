// Sample zone data for development (fallback when backend unavailable)
const SAMPLE_ZONES = [
    {
        id: 1,
        borough: "Manhattan",
        zone: "Financial District",
        geometry: {
            type: "Polygon",
            coordinates: [[
                [-74.0141, 40.7074],
                [-74.0050, 40.7074],
                [-74.0050, 40.7010],
                [-74.0141, 40.7010],
                [-74.0141, 40.7074]
            ]]
        }
    },
    {
        id: 2,
        borough: "Manhattan",
        zone: "Midtown",
        geometry: {
            type: "Polygon",
            coordinates: [[
                [-73.9885, 40.7589],
                [-73.9785, 40.7589],
                [-73.9785, 40.7489],
                [-73.9885, 40.7489],
                [-73.9885, 40.7589]
            ]]
        }
    },
    {
        id: 3,
        borough: "Manhattan",
        zone: "Upper East Side",
        geometry: {
            type: "Polygon",
            coordinates: [[
                [-73.9665, 40.7736],
                [-73.9565, 40.7736],
                [-73.9565, 40.7636],
                [-73.9665, 40.7636],
                [-73.9665, 40.7736]
            ]]
        }
    },
    {
        id: 4,
        borough: "Brooklyn",
        zone: "Williamsburg",
        geometry: {
            type: "Polygon",
            coordinates: [[
                [-73.9635, 40.7181],
                [-73.9535, 40.7181],
                [-73.9535, 40.7081],
                [-73.9635, 40.7081],
                [-73.9635, 40.7181]
            ]]
        }
    },
    {
        id: 5,
        borough: "Brooklyn",
        zone: "Downtown Brooklyn",
        geometry: {
            type: "Polygon",
            coordinates: [[
                [-73.9885, 40.6945],
                [-73.9785, 40.6945],
                [-73.9785, 40.6845],
                [-73.9885, 40.6845],
                [-73.9885, 40.6945]
            ]]
        }
    },
    {
        id: 6,
        borough: "Queens",
        zone: "Astoria",
        geometry: {
            type: "Polygon",
            coordinates: [[
                [-73.9282, 40.7644],
                [-73.9182, 40.7644],
                [-73.9182, 40.7544],
                [-73.9282, 40.7544],
                [-73.9282, 40.7644]
            ]]
        }
    },
    {
        id: 7,
        borough: "Queens",
        zone: "Long Island City",
        geometry: {
            type: "Polygon",
            coordinates: [[
                [-73.9445, 40.7505],
                [-73.9345, 40.7505],
                [-73.9345, 40.7405],
                [-73.9445, 40.7405],
                [-73.9445, 40.7505]
            ]]
        }
    },
    {
        id: 8,
        borough: "Bronx",
        zone: "Yankee Stadium",
        geometry: {
            type: "Polygon",
            coordinates: [[
                [-73.9275, 40.8296],
                [-73.9175, 40.8296],
                [-73.9175, 40.8196],
                [-73.9275, 40.8196],
                [-73.9275, 40.8296]
            ]]
        }
    },
    {
        id: 9,
        borough: "Staten Island",
        zone: "St. George",
        geometry: {
            type: "Polygon",
            coordinates: [[
                [-74.0765, 40.6435],
                [-74.0665, 40.6435],
                [-74.0665, 40.6335],
                [-74.0765, 40.6335],
                [-74.0765, 40.6435]
            ]]
        }
    },
    {
        id: 10,
        borough: "Manhattan",
        zone: "Times Square",
        geometry: {
            type: "Polygon",
            coordinates: [[
                [-73.9870, 40.7580],
                [-73.9770, 40.7580],
                [-73.9770, 40.7480],
                [-73.9870, 40.7480],
                [-73.9870, 40.7580]
            ]]
        }
    }
];