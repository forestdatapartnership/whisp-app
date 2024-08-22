import { ColumnDef } from "@tanstack/react-table"
 
export type GeoAnalysisResult = {
  plotId: number
  geoid: string
  Admin_Level_1: string
  Centroid_lat: number
  Centroid_lon: number
  Cocoa_ETH: number
  Cocoa_bnetd: number
  Country: string
  ESA_TC_2020: number
  ESA_fire_2001: number
  ESA_fire_2002: number
  ESA_fire_2003: number
  ESA_fire_2004: number
  ESA_fire_2005: number
  ESA_fire_2006: number
  ESA_fire_2007: number
  ESA_fire_2008: number
  ESA_fire_2009: number
  ESA_fire_2010: number
  ESA_fire_2011: number
  ESA_fire_2012: number
  ESA_fire_2013: number
  ESA_fire_2014: number
  ESA_fire_2015: number
  ESA_fire_2016: number
  ESA_fire_2017: number
  ESA_fire_2018: number
  ESA_fire_2019: number
  ESA_fire_2020: number
  ESA_fire_before_2020: number
  EUFO_2020: number
  GFC_TC_2020: number
  GFC_loss_after_2020: number
  GFC_loss_before_2020: number
  GFC_loss_year_2001: number
  GFC_loss_year_2002: number
  GFC_loss_year_2003: number
  GFC_loss_year_2004: number
  GFC_loss_year_2005: number
  GFC_loss_year_2006: number
  GFC_loss_year_2007: number
  GFC_loss_year_2008: number
  GFC_loss_year_2009: number
  GFC_loss_year_2010: number
  GFC_loss_year_2011: number
  GFC_loss_year_2012: number
  GFC_loss_year_2013: number
  GFC_loss_year_2014: number
  GFC_loss_year_2015: number
  GFC_loss_year_2016: number
  GFC_loss_year_2017: number
  GFC_loss_year_2018: number
  GFC_loss_year_2019: number
  GFC_loss_year_2020: number
  GFC_loss_year_2021: number
  GFC_loss_year_2022: number
  GFC_loss_year_2023: number
  GLAD_Primary: number
  Geometry_type: string
  In_waterbody: string
  JAXA_FNF_2020: number
  MODIS_fire_2000: number
  MODIS_fire_2001: number
  MODIS_fire_2002: number
  MODIS_fire_2003: number
  MODIS_fire_2004: number
  MODIS_fire_2005: number
  MODIS_fire_2006: number
  MODIS_fire_2007: number
  MODIS_fire_2008: number
  MODIS_fire_2009: number
  MODIS_fire_2010: number
  MODIS_fire_2011: number
  MODIS_fire_2012: number
  MODIS_fire_2013: number
  MODIS_fire_2014: number
  MODIS_fire_2015: number
  MODIS_fire_2016: number
  MODIS_fire_2017: number
  MODIS_fire_2018: number
  MODIS_fire_2019: number
  MODIS_fire_2020: number
  MODIS_fire_2021: number
  MODIS_fire_2022: number
  MODIS_fire_2023: number
  MODIS_fire_2024: number
  MODIS_fire_after_2020: number
  MODIS_fire_before_2020: number
  Oil_palm_Descals: number
  Oil_palm_FDaP: number
  Plot_ID: number
  Plot_area_ha: number
  RADD_after_2020: number
  RADD_before_2020: number
  RADD_year_2019: number
  RADD_year_2020: number
  RADD_year_2021: number
  RADD_year_2022: number
  RADD_year_2023: number
  RADD_year_2024: number
  TMF_def_2000: number
  TMF_def_2001: number
  TMF_def_2002: number
  TMF_def_2003: number
  TMF_def_2004: number
  TMF_def_2005: number
  TMF_def_2006: number
  TMF_def_2007: number
  TMF_def_2008: number
  TMF_def_2009: number
  TMF_def_2010: number
  TMF_def_2011: number
  TMF_def_2012: number
  TMF_def_2013: number
  TMF_def_2014: number
  TMF_def_2015: number
  TMF_def_2016: number
  TMF_def_2017: number
  TMF_def_2018: number
  TMF_def_2019: number
  TMF_def_2020: number
  TMF_def_2021: number
  TMF_def_2022: number
  TMF_def_after_2020: number
  TMF_def_before_2020: number
  TMF_deg_2000: number
  TMF_deg_2001: number
  TMF_deg_2002: number
  TMF_deg_2003: number
  TMF_deg_2004: number
  TMF_deg_2005: number
  TMF_deg_2006: number
  TMF_deg_2007: number
  TMF_deg_2008: number
  TMF_deg_2009: number
  TMF_deg_2010: number
  TMF_deg_2011: number
  TMF_deg_2012: number
  TMF_deg_2013: number
  TMF_deg_2014: number
  TMF_deg_2015: number
  TMF_deg_2016: number
  TMF_deg_2017: number
  TMF_deg_2018: number
  TMF_deg_2019: number
  TMF_deg_2020: number
  TMF_deg_2021: number
  TMF_deg_2022: number
  TMF_deg_after_2020: number
  TMF_deg_before_2020: number
  TMF_disturbed: number
  TMF_plant: number
  TMF_undist: number
  Unit: string
  WDPA: string
  geometry: string
  Indicator_1_treecover: string
  Indicator_2_commodities: string
  Indicator_3_disturbance_before_2020: string
  Indicator_4_disturbance_after_2020: string
  EUDR_risk: string  
}
 
export const columns: ColumnDef<GeoAnalysisResult>[] = [
  {
    accessorKey: "plotId",
    header: "plotId",
    enableHiding: false,
  },
  {
    accessorKey: "geoid",
    header: "geoid",
  },
  {
    accessorKey: "Admin_Level_1",
    header: "Admin_Level_1",
  },
  // {
  //   accessorKey: "Centroid_lat",
  //   header: "Centroid_lat", 
  // },
  // {
  //   accessorKey: "Centroid_lon",
  //   header: "Centroid_lon",
  // },
  {
    accessorKey: "Cocoa_ETH",
    header: "Cocoa_ETH",
  },
  {
    accessorKey: "Cocoa_bnetd",
    header: "Cocoa_bnetd",
  },
  {
    accessorKey: "Country",
    header: "Country",
  },
  {
    accessorKey: "ESA_TC_2020",
    header: "ESA_TC_2020",
  },
  {
    accessorKey: "ESA_fire_2001",
    header: "ESA_fire_2001",
  },
  {
    accessorKey: "ESA_fire_2002",
    header: "ESA_fire_2002",
  },
  {
    accessorKey: "ESA_fire_2003",
    header: "ESA_fire_2003",
  },
  {
    accessorKey: "ESA_fire_2004",
    header: "ESA_fire_2004",
  },
  {
    accessorKey: "ESA_fire_2005",
    header: "ESA_fire_2005",
  },
  {
    accessorKey: "ESA_fire_2006",
    header: "ESA_fire_2006",
  },
  {
    accessorKey: "ESA_fire_2007",
    header: "ESA_fire_2007",
  },
  {
    accessorKey: "ESA_fire_2008",
    header: "ESA_fire_2008",
  },
  {
    accessorKey: "ESA_fire_2009",
    header: "ESA_fire_2009",
  },
  {
    accessorKey: "ESA_fire_2010",
    header: "ESA_fire_2010",
  },
  {
    accessorKey: "ESA_fire_2011",
    header: "ESA_fire_2011",
  },
  {
    accessorKey: "ESA_fire_2012",
    header: "ESA_fire_2012",
  },
  {
    accessorKey: "ESA_fire_2013",
    header: "ESA_fire_2013",
  },
  {
    accessorKey: "ESA_fire_2014",
    header: "ESA_fire_2014",
  },
  {
    accessorKey: "ESA_fire_2015",
    header: "ESA_fire_2015",
  },
  {
    accessorKey: "ESA_fire_2016",
    header: "ESA_fire_2016",
  },
  {
    accessorKey: "ESA_fire_2017",
    header: "ESA_fire_2017",
  },
  {
    accessorKey: "ESA_fire_2018",
    header: "ESA_fire_2018",
  },
  {
    accessorKey: "ESA_fire_2019",
    header: "ESA_fire_2019",
  },
  {
    accessorKey: "ESA_fire_2020",
    header: "ESA_fire_2020",
  },
  {
    accessorKey: "ESA_fire_before_2020",
    header: "ESA_fire_before_2020",
  },
  {
    accessorKey: "EUFO_2020",
    header: "EUFO_2020",
  },
  {
    accessorKey: "GFC_TC_2020",
    header: "GFC_TC_2020",
  },
  {
    accessorKey: "GFC_loss_after_2020",
    header: "GFC_loss_after_2020",
  },
  {
    accessorKey: "GFC_loss_before_2020",
    header: "GFC_loss_before_2020",
  },
  {
    accessorKey: "GFC_loss_year_2001",
    header: "GFC_loss_year_2001",
  },
  {
    accessorKey: "GFC_loss_year_2002",
    header: "GFC_loss_year_2002",
  },
  {
    accessorKey: "GFC_loss_year_2003",
    header: "GFC_loss_year_2003",
  },
  {
    accessorKey: "GFC_loss_year_2004",
    header: "GFC_loss_year_2004",
  },
  {
    accessorKey: "GFC_loss_year_2005",
    header: "GFC_loss_year_2005",
  },
  {
    accessorKey: "GFC_loss_year_2006",
    header: "GFC_loss_year_2006",
  },
  {
    accessorKey: "GFC_loss_year_2007",
    header: "GFC_loss_year_2007",
  },
  {
    accessorKey: "GFC_loss_year_2008",
    header: "GFC_loss_year_2008",
  },
  {
    accessorKey: "GFC_loss_year_2009",
    header: "GFC_loss_year_2009",
  },
  {
    accessorKey: "GFC_loss_year_2010",
    header: "GFC_loss_year_2010",
  },
  {
    accessorKey: "GFC_loss_year_2011",
    header: "GFC_loss_year_2011",
  },
  {
    accessorKey: "GFC_loss_year_2012",
    header: "GFC_loss_year_2012",
  },
  {
    accessorKey: "GFC_loss_year_2013",
    header: "GFC_loss_year_2013",
  },
  {
    accessorKey: "GFC_loss_year_2014",
    header: "GFC_loss_year_2014",
  },
  {
    accessorKey: "GFC_loss_year_2015",
    header: "GFC_loss_year_2015",
  },
  {
    accessorKey: "GFC_loss_year_2016",
    header: "GFC_loss_year_2016",
  },
  {
    accessorKey: "GFC_loss_year_2017",
    header: "GFC_loss_year_2017",
  },
  {
    accessorKey: "GFC_loss_year_2018",
    header: "GFC_loss_year_2018",
  },
  {
    accessorKey: "GFC_loss_year_2019",
    header: "GFC_loss_year_2019",
  },
  {
    accessorKey: "GFC_loss_year_2020",
    header: "GFC_loss_year_2020",
  },
  {
    accessorKey: "GFC_loss_year_2021",
    header: "GFC_loss_year_2021",
  },
  {
    accessorKey: "GFC_loss_year_2022",
    header: "GFC_loss_year_2022",
  },
  {
    accessorKey: "GFC_loss_year_2023",
    header: "GFC_loss_year_2023",
  },
  {
    accessorKey: "GLAD_Primary",
    header: "GLAD_Primary",
  },
  {
    accessorKey: "Geometry_type",
    header: "Geometry_type",
  },
  {
    accessorKey: "In_waterbody",
    header: "In_waterbody",
  },
  {
    accessorKey: "JAXA_FNF_2020",
    header: "JAXA_FNF_2020",
  },
  {
    accessorKey: "MODIS_fire_2000",
    header: "MODIS_fire_2000",
  },
  {
    accessorKey: "MODIS_fire_2001",
    header: "MODIS_fire_2001",
  },
  {
    accessorKey: "MODIS_fire_2002",
    header: "MODIS_fire_2002",
  },
  {
    accessorKey: "MODIS_fire_2003",
    header: "MODIS_fire_2003",
  },
  {
    accessorKey: "MODIS_fire_2004",
    header: "MODIS_fire_2004",
  },
  {
    accessorKey: "MODIS_fire_2005",
    header: "MODIS_fire_2005",
  },
  {
    accessorKey: "MODIS_fire_2006",
    header: "MODIS_fire_2006",
  },
  {
    accessorKey: "MODIS_fire_2007",
    header: "MODIS_fire_2007",
  },
  {
    accessorKey: "MODIS_fire_2008",
    header: "MODIS_fire_2008",
  },
  {
    accessorKey: "MODIS_fire_2009",
    header: "MODIS_fire_2009",
  },
  {
    accessorKey: "MODIS_fire_2010",
    header: "MODIS_fire_2010",
  },
  {
    accessorKey: "MODIS_fire_2011",
    header: "MODIS_fire_2011",
  },
  {
    accessorKey: "MODIS_fire_2012",
    header: "MODIS_fire_2012",
  },
  {
    accessorKey: "MODIS_fire_2013",
    header: "MODIS_fire_2013",
  },
  {
    accessorKey: "MODIS_fire_2014",
    header: "MODIS_fire_2014",
  },
  {
    accessorKey: "MODIS_fire_2015",
    header: "MODIS_fire_2015",
  },
  {
    accessorKey: "MODIS_fire_2016",
    header: "MODIS_fire_2016",
  },
  {
    accessorKey: "MODIS_fire_2017",
    header: "MODIS_fire_2017",
  },
  {
    accessorKey: "MODIS_fire_2018",
    header: "MODIS_fire_2018",
  },
  {
    accessorKey: "MODIS_fire_2019",
    header: "MODIS_fire_2019",
  },
  {
    accessorKey: "MODIS_fire_2020",
    header: "MODIS_fire_2020",
  },
  {
    accessorKey: "MODIS_fire_2021",
    header: "MODIS_fire_2021",
  },
  {
    accessorKey: "MODIS_fire_2022",
    header: "MODIS_fire_2022",
  },
  {
    accessorKey: "MODIS_fire_2023",
    header: "MODIS_fire_2023",
  },
  {
    accessorKey: "MODIS_fire_2024",
    header: "MODIS_fire_2024",
  },
  {
    accessorKey: "MODIS_fire_after_2020",
    header: "MODIS_fire_after_2020",
  },
  {
    accessorKey: "MODIS_fire_before_2020",
    header: "MODIS_fire_before_2020",
  },
  {
    accessorKey: "Oil_palm_Descals",
    header: "Oil_palm_Descals",
  },
  {
    accessorKey: "Oil_palm_FDaP",
    header: "Oil_palm_FDaP",
  },
  {
    accessorKey: "Plot_ID",
    header: "Plot_ID",
  },
  {
    accessorKey: "Plot_area_ha",
    header: "Plot_area_ha",
  },
  {
    accessorKey: "RADD_after_2020",
    header: "RADD_after_2020",
  },
  {
    accessorKey: "RADD_before_2020",
    header: "RADD_before_2020",
  },
  {
    accessorKey: "RADD_year_2019",
    header: "RADD_year_2019",
  },
  {
    accessorKey: "RADD_year_2020",
    header: "RADD_year_2020",
  },
  {
    accessorKey: "RADD_year_2021",
    header: "RADD_year_2021",
  },
  {
    accessorKey: "RADD_year_2022",
    header: "RADD_year_2022",
  },
  {
    accessorKey: "RADD_year_2023",
    header: "RADD_year_2023",
  },
  {
    accessorKey: "RADD_year_2024",
    header: "RADD_year_2024",
  },
  {
    accessorKey: "TMF_def_2000",
    header: "TMF_def_2000",
  },
  {
    accessorKey: "TMF_def_2001",
    header: "TMF_def_2001",
  },
  {
    accessorKey: "TMF_def_2002",
    header: "TMF_def_2002",
  },
  {
    accessorKey: "TMF_def_2003",
    header: "TMF_def_2003",
  },
  {
    accessorKey: "TMF_def_2004",
    header: "TMF_def_2004",
  },
  {
    accessorKey: "TMF_def_2005",
    header: "TMF_def_2005",
  },
  {
    accessorKey: "TMF_def_2006",
    header: "TMF_def_2006",
  },
  {
    accessorKey: "TMF_def_2007",
    header: "TMF_def_2007",
  },
  {
    accessorKey: "TMF_def_2008",
    header: "TMF_def_2008",
  },
  {
    accessorKey: "TMF_def_2009",
    header: "TMF_def_2009",
  },
  {
    accessorKey: "TMF_def_2010",
    header: "TMF_def_2010",
  },
  {
    accessorKey: "TMF_def_2011",
    header: "TMF_def_2011",
  },
  {
    accessorKey: "TMF_def_2012",
    header: "TMF_def_2012",
  },
  {
    accessorKey: "TMF_def_2013",
    header: "TMF_def_2013",
  },
  {
    accessorKey: "TMF_def_2014",
    header: "TMF_def_2014",
  },
  {
    accessorKey: "TMF_def_2015",
    header: "TMF_def_2015",
  },
  {
    accessorKey: "TMF_def_2016",
    header: "TMF_def_2016",
  },
  {
    accessorKey: "TMF_def_2017",
    header: "TMF_def_2017",
  },
  {
    accessorKey: "TMF_def_2018",
    header: "TMF_def_2018",
  },
  {
    accessorKey: "TMF_def_2019",
    header: "TMF_def_2019",
  },
  {
    accessorKey: "TMF_def_2020",
    header: "TMF_def_2020",
  },
  {
    accessorKey: "TMF_def_2021",
    header: "TMF_def_2021",
  },
  {
    accessorKey: "TMF_def_2022",
    header: "TMF_def_2022",
  },
  {
    accessorKey: "TMF_def_after_2020",
    header: "TMF_def_after_2020",
  },
  {
    accessorKey: "TMF_def_before_2020",
    header: "TMF_def_before_2020",
  },
  {
    accessorKey: "TMF_deg_2000",
    header: "TMF_deg_2000",
  },
  {
    accessorKey: "TMF_deg_2001",
    header: "TMF_deg_2001",
  },
  {
    accessorKey: "TMF_deg_2002",
    header: "TMF_deg_2002",
  },
  {
    accessorKey: "TMF_deg_2003",
    header: "TMF_deg_2003",
  },
  {
    accessorKey: "TMF_deg_2004",
    header: "TMF_deg_2004",
  },
  {
    accessorKey: "TMF_deg_2005",
    header: "TMF_deg_2005",
  },
  {
    accessorKey: "TMF_deg_2006",
    header: "TMF_deg_2006",
  },
  {
    accessorKey: "TMF_deg_2007",
    header: "TMF_deg_2007",
  },
  {
    accessorKey: "TMF_deg_2008",
    header: "TMF_deg_2008",
  },
  {
    accessorKey: "TMF_deg_2009",
    header: "TMF_deg_2009",
  },
  {
    accessorKey: "TMF_deg_2010",
    header: "TMF_deg_2010",
  },
  {
    accessorKey: "TMF_deg_2011",
    header: "TMF_deg_2011",
  },
  {
    accessorKey: "TMF_deg_2012",
    header: "TMF_deg_2012",
  },
  {
    accessorKey: "TMF_deg_2013",
    header: "TMF_deg_2013",
  },
  {
    accessorKey: "TMF_deg_2014",
    header: "TMF_deg_2014",
  },
  {
    accessorKey: "TMF_deg_2015",
    header: "TMF_deg_2015",
  },
  {
    accessorKey: "TMF_deg_2016",
    header: "TMF_deg_2016",
  },
  {
    accessorKey: "TMF_deg_2017",
    header: "TMF_deg_2017",
  },
  {
    accessorKey: "TMF_deg_2018",
    header: "TMF_deg_2018",
  },
  {
    accessorKey: "TMF_deg_2019",
    header: "TMF_deg_2019",
  },
  {
    accessorKey: "TMF_deg_2020",
    header: "TMF_deg_2020",
  },
  {
    accessorKey: "TMF_deg_2021",
    header: "TMF_deg_2021",
  },
  {
    accessorKey: "TMF_deg_2022",
    header: "TMF_deg_2022",
  },
  {
    accessorKey: "TMF_deg_after_2020",
    header: "TMF_deg_after_2020",
  },
  {
    accessorKey: "TMF_deg_before_2020",
    header: "TMF_deg_before_2020",
  },
  {
    accessorKey: "TMF_disturbed",
    header: "TMF_disturbed",
  },
  {
    accessorKey: "TMF_plant",
    header: "TMF_plant",
  },
  {
    accessorKey: "TMF_undist",
    header: "TMF_undist",
  },
  {
    accessorKey: "Unit",
    header: "Unit",
  },
  {
    accessorKey: "WDPA",
    header: "WDPA",
  },
  // {
  //   accessorKey: "geometry",
  //   header: "geometry",
  // },
  {
    accessorKey: "Indicator_1_treecover",
    header: "Indicator_1_treecover",
  },
  {
    accessorKey: "Indicator_2_commodities",
    header: "Indicator_2_commodities",
  },
  {
    accessorKey: "Indicator_3_disturbance_before_2020",
    header: "Indicator_3_disturbance_before_2020",
  },
  {
    accessorKey: "Indicator_4_disturbance_after_2020",
    header: "Indicator_4_disturbance_after_2020",
  },
  {
    accessorKey: "EUDR_risk",
    header: "EUDR_risk",
  },
]
