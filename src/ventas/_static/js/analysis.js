let analysis =
{
    init()
    {
        fetch("./?_svc=last-year-sales").then(response => response.json())
        .then(data => this.print_chart_last_year_sales(data))
        .catch(error => { console.log(error.message ?? JSON.stringify(error)) });

        fetch("./?_svc=sales-by-line").then(response => response.json())
        .then(data => this.print_chart_sales_by_line(data))
        .catch(error => { console.log(error.message ?? JSON.stringify(error)) });

        fetch("./?_svc=ten-top-sellers").then(response => response.json())
        .then(data => this.print_chart_ten_top_sellers(data))
        .catch(error => { console.log(error.message ?? JSON.stringify(error)) });

        fetch("./?_svc=ten-top-customers").then(response => response.json())
        .then(data => this.print_chart_ten_top_customers(data))
        .catch(error => { console.log(error.message ?? JSON.stringify(error)) });
    },

    print_chart_last_year_sales(data) {
        const chart_last_year_sales = document.getElementById("chart_last_year_sales");
        const last_year_sales = data;
        document.getElementById("spinner-1").remove();
        new Chart(chart_last_year_sales, {
            type: "bar",
            data: {
                labels: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
                datasets: [{
                    label: 'Monto',
                    data: last_year_sales.map(obj => obj.subtotal),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(255, 159, 64, 0.2)',
                        'rgba(255, 205, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(255, 159, 64, 0.2)',
                        'rgba(255, 205, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                    ],
                    borderColor: [
                        'rgb(255, 99, 132)',
                        'rgb(255, 159, 64)',
                        'rgb(255, 205, 86)',
                        'rgb(75, 192, 192)',
                        'rgb(54, 162, 235)',
                        'rgb(153, 102, 255)',
                        'rgb(255, 99, 132)',
                        'rgb(255, 159, 64)',
                        'rgb(255, 205, 86)',
                        'rgb(75, 192, 192)',
                        'rgb(54, 162, 235)',
                        'rgb(153, 102, 255)',
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    print_chart_sales_by_line(data) {
        const chart_sales_by_line = document.getElementById("chart_sales_by_line");
        const sales_by_line = data;
        document.getElementById("spinner-2").remove();
        new Chart(chart_sales_by_line, {
            type: "bar",
            data: {
                labels: sales_by_line.map(obj => obj.descripcion),
                datasets: [{
                    label: 'Monto',
                    data: sales_by_line.map(obj => obj.subtotal),
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    print_chart_ten_top_sellers(data) {
        const chart_ten_top_sellers = document.getElementById("chart_ten_top_sellers");
        const ten_top_sellers = data;
        document.getElementById("spinner-3").remove();
        new Chart(chart_ten_top_sellers, {
            type: "pie",
            data: {
                labels: ten_top_sellers.map(obj => obj.descripcion),
                datasets: [{
                    label: 'Monto',
                    data: ten_top_sellers.map(obj => obj.subtotal),
                    backgroundColor: [
                        'rgb(255, 99, 132)',
                        'rgb(54, 162, 235)',
                        'rgb(255, 205, 86)',
                        'rgb(255, 102, 255)',
                        'rgb(255, 178, 102)',
                        'rgb(64, 224, 208)',
                        'rgb(200, 162, 200)',
                        'rgb(102, 255, 102)',
                        'rgb(102, 255, 255)',
                        'rgb(255, 182, 193)',
                    ]
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    print_chart_ten_top_customers(data) {
        const chart_ten_top_customers = document.getElementById("chart_ten_top_customers");
        const ten_top_customers = data;
        document.getElementById("spinner-4").remove();
        new Chart(chart_ten_top_customers, {
            type: "pie",
            data: {
                labels: ten_top_customers.map(obj => obj.nombre),
                datasets: [{
                    label: 'Monto',
                    data: ten_top_customers.map(obj => obj.subtotal),
                    backgroundColor: [
                        'rgb(255, 99, 132)',
                        'rgb(54, 162, 235)',
                        'rgb(255, 205, 86)',
                        'rgb(255, 102, 255)',
                        'rgb(255, 178, 102)',
                        'rgb(64, 224, 208)',
                        'rgb(200, 162, 200)',
                        'rgb(102, 255, 102)',
                        'rgb(102, 255, 255)',
                        'rgb(255, 182, 193)',
                    ]
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    async getData(url)
    {
        try {
            const response = await fetch(url);
            const data = await response.json();

            return data;
        } catch (error) {
            alert(error.message);
        }
    },
}