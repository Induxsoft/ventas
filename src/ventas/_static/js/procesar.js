var procesar =
{
    init()
    {
        const form_contado = document.getElementById("form_liquidacion_contado");
        const form_credito = document.getElementById("form_liquidacion_credito");
        const form_consignado = document.getElementById("form_liquidacion_consignado");
        const form_noaplica = document.getElementById("form_liquidacion_na");
        const form_devolucion = document.getElementById("form_devolucion");
        
        if (form_credito) this.credito.init(form_credito);
        if (form_devolucion) this.devolucion.init(form_devolucion);
    },

    contado:{},
    credito:{
        form:null, fields:null,

        init(form)
        {
            this.form = form;
            this.fields = form.elements;
            const sel_divisa = this.fields["sel_divisa"];
            const txt_tcambio = this.fields["txt_tcambio"];

            sel_divisa.addEventListener("change", () => {
                const opt_divisa = sel_divisa.options[sel_divisa.selectedIndex];
                txt_tcambio.value = Number(opt_divisa.getAttribute("data-tcambio") ?? "1");
            });
        },
    },
    consignado:{},
    noaplica:{},
    devolucion:{
        form:null, fields:null,

        init(form)
        {
            this.form = form;
            this.fields = form.elements;
            const rdb_retiro = this.fields["rdb_retiro"];
            const rdb_bonifi = this.fields["rdb_bonificacion"];
            const div_cuenta = document.getElementById("div_sel_cuenta");
            const div_egreso = document.getElementById("div_cat_egreso");

            rdb_retiro.addEventListener("focus", () => {
                div_cuenta.hidden = false;
                div_egreso.hidden = false;
            });
            rdb_bonifi.addEventListener("focus", () => {
                div_cuenta.hidden = true;
                div_egreso.hidden = true;
            });
        },
    },
}