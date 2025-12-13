import { useContext } from "react";
import { Container } from "@mui/material";
import { Context } from "../..";
import { observer } from "mobx-react-lite";
import UsersTable from "../../components/admin/UsersTable";
import AdminAppBar from "../admin/AdminAppBar";

const UsersPage = observer(() => {
  const { store } = useContext(Context);

  return (
    <>
    <AdminAppBar/>
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <UsersTable />
    </Container>
    </>
  );
});

export default UsersPage;