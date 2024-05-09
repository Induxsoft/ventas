var venta =
{
    url_get_fultimo:"", url_get_series:"",

    init()
    {
        const sel_documento = document.getElementById("sel_documento");
        const btn_get_folio = document.getElementById("btn_get_folio");
        const sel_divisa = document.getElementById("sel_divisa");
        const txt_tipocambio = document.getElementById("txt_tipocambio");

        if (btn_get_folio) btn_get_folio.addEventListener("click", () => { this.getFolio() });
        if (sel_documento) sel_documento.addEventListener("change", () => fillSelect("sel_serie","serie","serie",this.url_get_series,{doctype:sel_documento.value}));
        if (sel_divisa) sel_divisa.addEventListener("change", () => {
            const opt_divisa = sel_divisa.options[sel_divisa.selectedIndex];
            txt_tipocambio.value = Number(opt_divisa.getAttribute("data-tcambio") ?? "1");
        });

        trigger(sel_divisa,"change");
    },

    getFolio()
    {
        const sel_serie = document.getElementById("sel_serie");
        const opt_serie = sel_serie.options[sel_serie.selectedIndex];
        const txt_folio = document.getElementById("txt_folio");

        if (Number(txt_folio.value) > 0) return;
        
        let iblock = Number(opt_serie.getAttribute("data-iblock"));
        let url = this.url_get_fultimo.replace("@iblock",iblock);

        fetch(url).then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                return;
            }

            txt_folio.value = data.fultimo;
        })
        .catch(error => console.error(error));
    },
}