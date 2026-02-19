// Sample NYC taxi zones data for development
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
        id: 4,
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
    }
];