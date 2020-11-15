import {Heading} from "@airtable/blocks/ui";
import React from "react";
import {DashboardTile} from "./DashboardTile";

const NoEvalTile = () => <DashboardTile>
    <Heading>
        Nenhum dado encontrado.
    </Heading>
</DashboardTile>

export default NoEvalTile;
