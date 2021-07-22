// import from external libraries
import React from 'react';
import {
    FormGroup,
    FormLabel,
    TextField,
    Checkbox,
    FormControlLabel,
} from '@material-ui/core'
import MUIDataTable from "mui-datatables";

// helper functions for data organization
import { collectData, rowsToDisplay } from "./format.js";

// connection to Octopus
const API = '/api/v1/orders?includeOrderItems=true'

// very closely modeled after the mui-datatables's "customize-filter" example
class SalesBySku extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            isOrganizing: false,
            totalFilterChecked: false,
            isCalculating: false,
            startDate: "20210625",
            endDate: "20210627",
            allSales: 0,
            rows: [], // raw data fetched from api
            formattedRows: [], // formatted into Sales by SKU using collect.js
            displayRows: [] // formatted into rows using rowsToDisplay
        }
    }

    // sequential data organizing
    findTotal = () => {
        return this.setState(
            { 
              allSales: this.state.displayRows.map(obj => obj[3])
                                              .reduce((a,b) => a+b, 0),
              isCalculating: false
            }
        );
    }

    formatData = (result) => {
        return this.setState(
            {
              rows: result,
              isLoading: false,
              isOrganizing: true
            },
            () => this.setState(
                { 
                  formattedRows: collectData(this.state.rows)
                },
                () => this.setState(
                    { 
                      displayRows: rowsToDisplay(this.state.formattedRows),
                      isOrganizing: false,
                      isCalculating: true
                    },
                    () => this.findTotal()
                )
            )
        );
    }

    setData = (startD, endD) => {
        this.setState({ isLoading: true })
        const url = API + `&orderDateStart=${startD}&orderDateEnd=${endD}`;
        fetch(url)
          .then(response => response.json())
          .then(result => this.formatData(result))
          .catch(error => { console.log(error); });
    }

    // formatting dates for the filter
    dateFormat = yyyymmdd => {
        const month = {
            '01': 'Jan',
            '02': 'Feb',
            '03': 'Mar',
            '04': 'Apr',
            '05': 'May',
            '06': 'Jun',
            '07': 'Jul',
            '08': 'Aug',
            '09': 'Sep',
            '10': 'Oct',
            '11': 'Nov',
            '12': 'Dec'
        };

        const y = yyyymmdd.slice(0, 4);
        const m = yyyymmdd.slice(4, 6);
        const d = yyyymmdd.slice(6, 8);
        return `${month[m]} ${d}, ${y}`;
    };

    toDashFormat = yyyymmdd => {
        if (typeof yyyymmdd === 'undefined' || yyyymmdd.length < 8) { return ""; }

        const y = yyyymmdd.slice(0, 4);
        const m = yyyymmdd.slice(4, 6);
        const d = yyyymmdd.slice(6, 8);
        return `${y}-${m}-${d}`;
    }

    // need to use global flag on regex to fully replace every hyphen, see /questions/6204867/
    fromDashFormat = yyyymmddDash => {
        return yyyymmddDash.replace(/-/g, "");
    }

    componentDidMount() {
        this.setData(this.state.startDate, this.state.endDate);
    }

    // fix Warning: Can't perform a React state update on an unmounted component
    componentWillUnmount() {
        this.setState = (state, callback) => {
            return;
        };
    }
        
    render() {
        const columns = [
            {
                name: 'stdSku',
                label: 'Standard SKU',
                options: {
                    download: true,
                    filter: false,
                    filterType: 'dropdown',
                },
            },
            {
                name: 'marketSku', 
                label: 'Marketplace SKU',
                options: {
                    download: true,
                    filter: false,
                },
            },
            { 
                name: 'productName',
                label: 'Product Name',
                options: {
                    download: true,
                    filter: false,
                },
            },
            {
                name: 'total',
                label: 'Total',
                options: {
                    download: true,
                    filter: true,
                    filterType: 'custom',

                    customFilterListOptions: {
                        render: v => {
                          if (v[0] && v[1] && this.state.totalFilterChecked) {
                              return [`Min Total: ${v[0]}`, `Max Total: ${v[1]}`];
                          } else if (v[0] && v[1] && !this.state.totalFilterChecked) {
                              return `Min Total: ${v[0]}, Max Total: ${v[1]}`;
                          } else if (v[0]) {
                              return `Min Total: ${v[0]}`;
                          } else if (v[1]) {
                              return `Max Total: ${v[1]}`;
                          }
                          return [];
                        },
                        update: (filterList, filterPos, index) => {
                            console.log(
                                'customFilterListOnDelete: ', filterList, filterPos, index
                            );

                            if (filterPos === 0) {
                                filterList[index].splice(filterPos, 1, '');
                            } else if (filterPos === 1) {
                                filterList[index].splice(filterPos, 1);
                            } else if (filterPos === -1) {
                                filterList[index] = [];
                            }

                            return filterList;
                        },
                    },
                    filterOptions: {
                        names: [],
                        logic(total, filters) {
                            if (filters[0] && filters[1]) {
                                return total < filters[0] || total > filters[1];
                            } else if (filters[0]) {
                                return total < filters[0];
                            } else if (filters[1]) {
                                return total > filters[1];
                            }
                            return false;
                        },
                        display: (filterList, onChange, idx, col) => (
                            <div>
                              <FormLabel>Total</FormLabel>
                              <FormGroup row>
                                <TextField
                                  label='min'
                                  value={filterList[idx][0] || ''}
                                  onChange={event => {
                                    filterList[idx][0] = event.target.value;
                                    onChange(filterList[idx], idx, col);
                                  }}
                                  style={{ width: '45%', marginRight: '5%' }}
                                />
                                <TextField
                                  label='max'
                                  value={filterList[idx][1] || ''}
                                  onChange={event => {
                                    filterList[idx][1] = event.target.value;
                                    onChange(filterList[idx], idx, col);
                                  }}
                                  style={{ width: '45%' }}
                                />
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={this.state.totalFilterChecked}
                                      onChange={event => this.setState(
                                          { totalFilterChecked: event.target.checked }
                                        )
                                      }
                                    />
                                  }
                                  label='Separate Values'
                                  style={{ marginLeft: '0px' }}
                                />
                              </FormGroup>
                            </div>
                          ),
                        },
                    print: false,
                },
            },
            {
                name: 'amazonTotal',
                label: 'HB Amazon',
                options: {
                    download: true,
                    filter: false,
                },
            },
            {
                name: 'ebayTotal',
                label: 'HB eBay',
                options: {
                    download: true,
                    filter: false,
                },
            },
            {
                name: 'searsTotal',
                label: 'HB Sears',
                options: {
                    download: true,
                    filter: false,
                },
            },
            {
                name: 'walmartTotal', 
                label: 'HAB Walmart',
                options: {
                    download: true,
                    filter: false,
                },
            },
            { 
                name: 'websiteTotal',
                label: 'HB Website',
                options: {
                    download: true,
                    filter: false,
                },
            },
            {
                name: 'amazonMxTotal',
                label: 'MX Amazon',
                options: {
                    download: true,
                    filter: false,
                },
            },
            {
                name: 'ebayMxTotal', 
                label: 'MX eBay',
                options: {
                    download: true,
                    filter: false,
                },
            },
            {
                name: 'walmartMxTotal',
                label: 'MX Walmart',
                options: {
                    download: true,
                    filter: false,
                },
            },
            {
                name: 'date',
                label: 'Date',
                options: {
                    display: false,
                    download: true,
                    filter: true,
                    filterType: 'custom',
                    filterList: [this.state.startDate, this.state.endDate],

                    customFilterListOptions: {
                        render: v => {
                          if (v[0] && v[1]) {
                              return [`From: ${this.dateFormat(v[0])}`,
                                      `To: ${this.dateFormat(v[1])}`];
                          } else if (v[0]) {
                              return `From: ${this.dateFormat(v[0])}`;
                          } else if (v[1]) {
                              return `To: ${this.dateFormat(v[1])}`;
                          }
                          return [];
                        },
                    },
                    filterOptions: {
                        names: [],
                        logic(total, filters) {
                            return false;
                        },
                        display: (filterList, onChange, idx, col) => (
                            <div>
                              <FormLabel>From</FormLabel>
                              <FormGroup row>
                                <TextField
                                  type="date"
                                  value={
                                    this.toDashFormat(filterList[idx][0]) || ''
                                  }
                                  onChange={event => {
                                    filterList[idx][0] = this.fromDashFormat(event.target.value);
                                    this.setState(
                                      { 
                                        startDate: filterList[idx][0]
                                      },
                                      () => this.setData(this.state.startDate,
                                                         this.state.endDate))
                                  }}
                                  style={{ width: '45%', marginRight: '5%' }}
                                />
                              </FormGroup>
                              <FormLabel>To</FormLabel>
                              <FormGroup>
                                <TextField
                                  type="date"
                                  value={this.toDashFormat(filterList[idx][1]) || ''}
                                  onChange={event => {
                                    filterList[idx][1] = this.fromDashFormat(event.target.value);
                                    this.setState(
                                      {
                                        endDate: filterList[idx][1]
                                      },
                                      () => this.setData(this.state.startDate,
                                                         this.state.endDate))
                                  }}
                                  style={{ width: '45%' }}
                                />
                              </FormGroup>
                            </div>
                          ),
                        },
                    print: false,
                },
            },
        ];

        const options = {
            filter: true,
            filterType: 'multiselect',
            responsive: 'standard',
            fixedHeader: true,
            fixedSelectColumn: true,
            tableBodyHeight: '600px'
        };

        return (
            <React.Fragment>
                <MUIDataTable
                    title={`Sales By SKU | All Sales: ${this.state.allSales}`}
                    data={this.state.isLoading ? [["Loading..."]] :
                            (this.state.isOrganizing ? [["Organizing..."]]
                                                     : this.state.displayRows)
                        }
                    columns={columns}
                    options={options}
                />
            </React.Fragment>
        );
    };
}

export default SalesBySku;

  