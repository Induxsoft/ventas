document.addEventListener("DOMContentLoaded",()=>ventaxsalir.init());


var ventaxsalir=
{
    es_lista: false,

    init()
    {
        if(this.es_lista)
        {
            this.initLista();
            return;
        }
        this.initForm();
    },

    // ------------------------------------------------------------------
    // Formulario (vista de detalle de una venta)
    // ------------------------------------------------------------------
    initForm()
    {
        this.btn_procesar=document.getElementById("btn_procesar");
        this.table=document.getElementById("tbl_productos");

        if(this.btn_procesar)this.btn_procesar.addEventListener("click",()=>this.process());
        if(this.table)
        {
            this.table.AutoAddRow = false;
            this.table.AutoDelRow = false;
        }
    },
    prepateData()
    {
        if(!this.table)
        {
            console.warn("No hay un elemento editable");
            return null;
        }
        
        let data=this.table.DataArray.filter(e=>e.cantidad_a_salir>0);
        if(!data || data.length < 1)
        {
            alert("Debe indicar la cantidad a salir de alguna partida");
            return null
        }
        let find=ventaxsalir.table.DataArray.find(e=> e.xsalir < e.cantidad_a_salir);
        if(find)
        {
            alert("El campo cantidad de entrega no puede ser mayor al campo por salir del producto: "+find.codigo+" - "+find.descripcion);
            return null;
        }
        return data;
    },

    // ------------------------------------------------------------------
    // Lista (vista de ventas por entregar, selección múltiple)
    // ------------------------------------------------------------------
    initLista()
    {
        this.btn_procesar=document.getElementById("btn_procesar");
        this.list_table=document.getElementById("ventas_x_salir");
        this.chk_sel_all=document.getElementById("toggle-all");

        if(this.btn_procesar)this.btn_procesar.addEventListener("click",()=>this.process());
        if(this.list_table)
        {
            const events = this.list_table.EdiTable.Const.Events;

            this.list_table.Events[events.FieldUpdated] = (e) => {
                if (e.value == 'No') this.chk_sel_all.checked = false;
                else
                {
                    let checked = this.list_table.DataArray.filter(r=>r.entregar=='Sí').length;
                    let total = this.list_table.DataArray.length;
                    this.chk_sel_all.checked = (checked == total);
                }
            }
        }
    },
    toggleAll(value)
    {
        (this.list_table.DataArray ?? []).forEach(row => {
            row.entregar = value ? 'Sí' : 'No';
        });
        this.list_table._printRows();
    },
    prepareDataLista()
    {
        let seleccionadas=this.list_table.DataArray.filter(r=>r.entregar=='Sí').map(o=>({sys_pk:o.sys_pk}));
        if(seleccionadas.length < 1)
        {
            alert("Debe seleccionar al menos una venta para procesar");
            return null;
        }
        return seleccionadas;
    },

    // ------------------------------------------------------------------
    // Envío común
    // ------------------------------------------------------------------
    process()
    {
        if (this.is_on_submit) return;
        this.is_on_submit = true;

        let data = this.es_lista ? this.prepareDataLista() : this.prepateData();
        if (!data) {
            this.is_on_submit = false;
            return
        }

        let endpoint = this.es_lista ? "./?_view=process-docs" : "./process/";
        let method = this.es_lista ? "POST" : "PATCH";

        let fd = new FormData();
        if (this.es_lista) fd.append("_ventas",JSON.stringify(data));
        else fd.append("_detalle",JSON.stringify(data));

        const onSuccess = (data) => {
            if (data.message) {
                alert(data.message);
                this.is_on_submit = false;
                return
            }

            if (this.es_lista)
            {
                let msg = "Procesados: " + data.procesadas.length;
                let err = "Fallidos: \n-" + data.con_error.map(o=>o.message).join("\n-")
                alert(msg +"\n"+err);
            }

            window.location.href = this.es_lista ? "." : "..";
        }

        const onFailure = (error) => {
            let content = error.message ?? JSON.stringify(error);
            alert(content);
            this.is_on_submit = false;
        }

        InduxsoftCrudlModel.InvokeService(endpoint, fd, onSuccess, onFailure, method, false, true, "", true);
    }
}
