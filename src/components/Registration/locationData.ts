// locationData.ts
export const locationData = {
  pais: [
    "BOLIVIA", 
    "ARGENTINA", 
    "BRASIL", 
    "CHILE", 
    "PARAGUAY", 
    "PERÚ"
  ],
  
  departamento: [
    "LA PAZ", 
    "SANTA CRUZ", 
    "COCHABAMBA", 
    "POTOSÍ", 
    "ORURO", 
    "TARIJA", 
    "CHUQUISACA", 
    "BENI", 
    "PANDO"
  ],
  
  provincia: [
    // LA PAZ
    "MURILLO", "OMASUYOS", "LOS ANDES", "ABEL ITURRALDE", 
    "MANCO KAPAC", "FRANZ TAMAYO", "GUALBERTO VILLARROEL",
    "INQUISIVI", "GENERAL JOSÉ MANUEL PANDO", "LARECAJA",
    "LOAYZA", "CARANAVI", "NOR YUNGAS", "SUD YUNGAS",
    
    // SANTA CRUZ
    "ANDRÉS IBÁÑEZ", "WARNES", "VELASCO", "CORDILLERA",
    "FLORIDA", "SANTIAGO DEL ESTERO", "SARA",
    "ICHILO", "CHIQUITOS", "GERMÁN BUSCH",
    "ÑUFLO DE CHÁVEZ", "ÁNGEL SANDOVAL", "MANUEL MARÍA CABALLERO",
    
    // COCHABAMBA
    "CERCADO", "QUILLACOLLO", "CHAPARE", "CAMPERO",
    "AYOPAYA", "ESTEBAN ARZE", "ARANI",
    "ARQUE", "CAPINOTA", "GERMÁN JORDÁN",
    "MIZQUE", "PUNATA", "BOLÍVAR", "TIRAQUE",
    
    // POTOSÍ
    "TOMAS FRÍAS", "NOR CHICHAS", "SUR CHICHAS",
    "ENRIQUE BALDIVIESO", "NOR LÍPEZ", "SUD LÍPEZ",
    "JOSÉ MARÍA LINARES", "ANTONIO QUIJARRO",
    "GENERAL BERNARDINO BILBAO", "RAFAEL BUSTILLO",
    "CORNELIO SAAVEDRA", "CHAYANTA", "MODESTO OMISTE",
    
    // ORURO
    "POOPÓ", "PANTALEÓN DALENCE",
    "LADISLAO CABRERA", "SAUCARÍ", "CARANGAS",
    "SAN PEDRO DE TOTORA", "SEBASTIÁN PAGADOR",
    "MEJILLONES", "NOR CARANGAS", "SUR CARANGAS",
    "SABAYA", "CHOQUE COTA", "COPAJIRA",
    
    // TARIJA
    "JOSÉ MARÍA AVILÉS", "ARCE",
    "GRAN CHACO", "ANICETO ARCE", "BURDET O'CONNOR",
    "MENDEZ", "AVILEZ", "CERRILLOS",
    
    // CHUQUISACA
    "OROPEZA", "TOMINA", "YAMPARÁEZ", "LUIS CALVO",
    "AZURDUY", "ZUDAÑEZ", "BELISARIO BOETO",
    "HERNANDO SILES", "JAIME ZUDÁÑEZ", "NOR CINTI",
    "SUD CINTI",
    
    // BENI
    "MOXOS", "MARBÁN", "VACA DÍEZ",
    "YACUMA", "BALLIVIÁN", "ITENEZ",
    "MAMORÉ", "MARBÁN", "MÁXIMOS",
    "GENERAL JOSÉ BALLIVIÁN",
    
    // PANDO
    "NICOLÁS SUÁREZ", "MANURIPI", "MADRE DE DIOS",
    "ABUNA", "FEDERICO ROMÁN", "FILADELFIA"
  ],
  
  localidad: [
    // LA PAZ
    "LA PAZ", "PALCA", "MECAPACA", "ACHOCALLA", "EL ALTO",
    "ACHACACHI", "HUARINA", "CHUA COCANI", "HUAÑJAHUIRA",
    "PUCARANI", "BATALLAS", "LAJA", "PUERTO PÉREZ",
    "IXIAMAS", "SAN BUENAVENTURA", "COPACABANA", "SAN PEDRO DE TIKINA",
    
    // SANTA CRUZ
    "SANTA CRUZ DE LA SIERRA", "COTOCA", "PORONGO", "LA GUARDIA",
    "WARNES", "OKINAWA UNO", "SAN IGNACIO DE VELASCO", 
    "SAN MIGUEL DE VELASCO", "SAN RAFAEL", "LAGUNILLAS", 
    "CHARAGUA", "CABEZAS", "CUEVO",
    
    // COCHABAMBA
    "COCHABAMBA", "SACABA", "COLOCAPIRHUA", "TIQUIPAYA", "VINTO",
    "QUILLACOLLO", "SIPE SIPE", "TAPACARÍ", "COLOMI", 
    "VILLA TUNARI", "PUERTO VILLARROEL",
    
    // POTOSÍ
    "POTOSÍ", "TINGUIPAYA", "YOCALLA", "COTAGAITA", "VITICHI",
    "TUPIZA", "ATOCHA",
    
    // ORURO
    "ORURO", "CARACOLLO", "EL CHORO", "POOPÓ", "PAZÑA",
    "HUANUNI", "MACHACAMARCA",
    
    // TARIJA
    "TARIJA", "ALTO ESPAÑA", "SAN LORENZO", "YACUIBA", 
    "VILLAMONTES", "CARAPARÍ",
    
    // CHUQUISACA
    "SUCRE", "YOTALA", "POROMA", "PADILLA", "TOMINA", "SOPACHUY",
    
    // BENI
    "TRINIDAD", "SAN JAVIER", "LOMA SUÁREZ", "SAN IGNACIO DE MOXOS", 
    "SAN ANDRÉS",
    
    // PANDO
    "COBIJA", "PORVENIR", "BOLPEBRA", "PUERTO RICO", "FILADELFIA"
  ],

  matricula: [
    "EFECTIVO", 
    "TRASLADO", 
    "RETIRADO", 
  ],
  
  getAutocompleteSuggestions: function(input: string, type: 'pais' | 'departamento' | 'provincia' | 'localidad' | 'matricula'): string[] {
    const data = this[type];
    if (!data) return [];
    
    const inputLower = input.toLowerCase();
    return data
      .filter(item => item.toLowerCase().includes(inputLower))
      .slice(0, 10);
  }
};